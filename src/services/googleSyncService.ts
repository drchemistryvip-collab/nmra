/**
 * Google Sync Service for AI Studio
 * Handles Google OAuth Authentication, Google Drive JSON Backups, and Google Sheets Syncing.
 */

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
}

export interface SyncDataPayload {
  schoolInfo: any;
  grades: any[];
  sections: any[];
  examSheets: any[];
  grade10Records: any;
  trashItems: any[];
  updatedAt: string;
}

const STORAGE_KEY_TOKEN = 'gdrive_oauth_token';
const STORAGE_KEY_USER = 'gdrive_user_profile';
const DRIVE_BACKUP_FILE_NAME = 'Gradebook_Backup_School_Data.json';

class GoogleSyncService {
  private accessToken: string | null = null;
  private userProfile: GoogleUserProfile | null = null;
  private tokenClient: any = null;

  constructor() {
    // Restore cached token and user profile if available
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedToken) {
      this.accessToken = savedToken;
    }
    if (savedUser) {
      try {
        this.userProfile = JSON.parse(savedUser);
      } catch {}
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getUserProfile(): GoogleUserProfile | null {
    return this.userProfile;
  }

  public isLoggedIn(): boolean {
    return !!this.accessToken && !!this.userProfile;
  }

  /**
   * Load Google Identity Services script dynamically
   */
  public async loadGisScript(): Promise<void> {
    if ((window as any).google?.accounts?.oauth2) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Prompt user to sign in with Google OAuth popup
   */
  public async signIn(): Promise<GoogleUserProfile> {
    await this.loadGisScript();

    return new Promise((resolve, reject) => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: '398662027396-placeholder.apps.googleusercontent.com', // fallback handled gracefully
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }

            this.accessToken = response.access_token;
            localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);

            try {
              // Fetch user profile info using access token
              const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              
              if (!userRes.ok) {
                throw new Error('Failed to fetch Google profile');
              }

              const userData = await userRes.json();
              this.userProfile = {
                email: userData.email,
                name: userData.name || userData.email.split('@')[0],
                picture: userData.picture,
              };

              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.userProfile));
              resolve(this.userProfile);
            } catch (err) {
              reject(err);
            }
          },
        });

        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Sign out and clear stored tokens
   */
  public signOut(): void {
    this.accessToken = null;
    this.userProfile = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  /**
   * Backup application state to Google Drive as a JSON file
   */
  public async backupToDrive(payload: SyncDataPayload): Promise<{ fileId: string; fileName: string }> {
    if (!this.accessToken) {
      throw new Error('کلیلا تێپەڕبوونێ يا Google نینە. ل پێشیدا ب جیمێلێ بچە ژوور.');
    }

    // 1. Check if backup file already exists in Drive
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_BACKUP_FILE_NAME}' and trashed=false&fields=files(id, name)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!searchRes.ok) {
      if (searchRes.status === 401) {
        this.signOut();
        throw new Error('دەسەڵاتا هەژمارا تە ڕابوویە، هیڤییە دووبارە بچییە ژوور ب جیمێلێ.');
      }
      throw new Error(`خەلەتی د لێگەڕیانا Drive دا: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

    const fileContent = JSON.stringify(payload, null, 2);

    if (existingFile) {
      // Update existing file content
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });

      if (!updateRes.ok) {
        throw new Error('سەرنەکەفت د نووکرنا پەڕگەیا Google Drive دا');
      }

      return { fileId: existingFile.id, fileName: DRIVE_BACKUP_FILE_NAME };
    } else {
      // Create a new multipart file in Drive
      const metadata = {
        name: DRIVE_BACKUP_FILE_NAME,
        mimeType: 'application/json',
      };

      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!createRes.ok) {
        throw new Error('سەرنەکەفت د دروستکرنا پەڕگەیا Google Drive دا');
      }

      const createData = await createRes.json();
      return { fileId: createData.id, fileName: DRIVE_BACKUP_FILE_NAME };
    }
  }

  /**
   * Restore/Download application state from Google Drive
   */
  public async restoreFromDrive(): Promise<SyncDataPayload | null> {
    if (!this.accessToken) {
      throw new Error('کلیلا تێپەڕبوونێ يا Google نینە. ل پێشیدا ب جیمێلێ بچە ژوور.');
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_BACKUP_FILE_NAME}' and trashed=false&fields=files(id, name)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!searchRes.ok) {
      if (searchRes.status === 401) {
        this.signOut();
        throw new Error('دەسەڵاتا هەژمارا تە ڕابوویە، هیڤییە دووبارە بچییە ژوور ب جیمێلێ.');
      }
      throw new Error(`خەلەتی د دۆزینەوەیا پەڕگەیا Google Drive دا: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    if (!searchData.files || searchData.files.length === 0) {
      return null;
    }

    const fileId = searchData.files[0].id;
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const downloadRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!downloadRes.ok) {
      throw new Error('سەرنەکەفت د دابەزاندنا داتایان ژ Google Drive');
    }

    const payload: SyncDataPayload = await downloadRes.json();
    return payload;
  }

  /**
   * Sync and Export full register to Google Sheets
   */
  public async createOrUpdateGoogleSheet(
    sheetTitle: string,
    headers: string[],
    rows: (string | number)[][]
  ): Promise<{ spreadsheetUrl: string }> {
    if (!this.accessToken) {
      throw new Error('تکايه ب جیمێلێ بچە ژوور دا کو نمرە بۆ Google Sheets بهێنە هنارتن.');
    }

    // Create a new Spreadsheet directly in user's Drive
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: sheetTitle,
        },
        sheets: [
          {
            properties: {
              title: 'سجلا نمران',
              rightToLeft: true,
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: headers.map((h) => ({ userEnteredValue: { stringValue: h } })),
                  },
                  ...rows.map((row) => ({
                    values: row.map((cell) => {
                      if (typeof cell === 'number') {
                        return { userEnteredValue: { numberValue: cell } };
                      }
                      return { userEnteredValue: { stringValue: String(cell ?? '') } };
                    }),
                  })),
                ],
              },
            ],
          },
        ],
      }),
    });

    if (!createRes.ok) {
      throw new Error('سەرنەکەفت د دروستکرنا خشتێ Google Sheets دا.');
    }

    const sheetData = await createRes.json();
    return {
      spreadsheetUrl: sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetData.spreadsheetId}`,
    };
  }
}

export const googleSyncService = new GoogleSyncService();
