import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

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

const DRIVE_BACKUP_FILE_NAME = 'Gradebook_Backup_School_Data.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Scopes required for Drive and Sheets
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

class GoogleSyncService {
  private accessToken: string | null = null;
  private userProfile: GoogleUserProfile | null = null;
  private isSigningIn = false;

  constructor() {
    // Listen for auth state changes to keep profile in sync
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.userProfile = {
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || '',
          picture: user.photoURL || undefined,
        };
      } else {
        this.userProfile = null;
        this.accessToken = null;
      }
    });
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
   * Prompt user to sign in with Google OAuth popup via Firebase
   */
  public async signIn(): Promise<GoogleUserProfile> {
    if (this.isSigningIn) {
      throw new Error('کریارا چوونە ژوورێ یا یا دەستپێکری...');
    }

    try {
      this.isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential?.accessToken) {
        throw new Error('نەگەهشتە کلیلا تێپەڕبوونێ (Access Token) ژ Google');
      }

      this.accessToken = credential.accessToken;
      this.userProfile = {
        email: result.user.email || '',
        name: result.user.displayName || result.user.email?.split('@')[0] || '',
        picture: result.user.photoURL || undefined,
      };

      return this.userProfile;
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      if (err.code === 'auth/popup-blocked') {
        throw new Error('پەنجەرا چوونە ژوورێ هاتە بلۆک کرن. تکایە ڕێ بدە ب Popup د مۆبایلا خۆ دا.');
      }
      throw err;
    } finally {
      this.isSigningIn = false;
    }
  }

  /**
   * Sign out and clear cached tokens
   */
  public async signOut(): Promise<void> {
    await firebaseSignOut(auth);
    this.accessToken = null;
    this.userProfile = null;
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
