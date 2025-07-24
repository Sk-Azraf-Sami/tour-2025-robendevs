import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { GlobalSettings, Team, MCQ, Puzzle, Admin } from "../types";

export class FirestoreService {
  // Global Settings
  static async getGlobalSettings(): Promise<GlobalSettings | null> {
    const docRef = doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    return docSnap.exists()
      ? ({ id: docSnap.id, ...docSnap.data() } as GlobalSettings)
      : null;
  }

  static async updateGlobalSettings(
    settings: Partial<GlobalSettings>
  ): Promise<void> {
    const docRef = doc(db, "settings", "global");
    await setDoc(docRef, settings, { merge: true });
  }

  // Teams
  static async getAllTeams(): Promise<Team[]> {
    const querySnapshot = await getDocs(collection(db, "teams"));
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Team
    );
  }

  static async getTeam(teamId: string): Promise<Team | null> {
    const docRef = doc(db, "teams", teamId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists()
      ? ({ id: docSnap.id, ...docSnap.data() } as Team)
      : null;
  }

  static async createTeam(team: Omit<Team, "id">): Promise<string> {
    const docRef = doc(collection(db, "teams"));
    await setDoc(docRef, team);
    return docRef.id;
  }

  static async updateTeam(
    teamId: string,
    updates: Partial<Team>
  ): Promise<void> {
    const docRef = doc(db, "teams", teamId);
    await updateDoc(docRef, updates);
  }

  static async deleteTeam(teamId: string): Promise<void> {
    const docRef = doc(db, "teams", teamId);
    await deleteDoc(docRef);
  }

  // MCQs
  static async getAllMCQs(): Promise<MCQ[]> {
    const querySnapshot = await getDocs(collection(db, "mcqs"));
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as MCQ
    );
  }

  static async getMCQ(mcqId: string): Promise<MCQ | null> {
    const docRef = doc(db, "mcqs", mcqId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists()
      ? ({ id: docSnap.id, ...docSnap.data() } as MCQ)
      : null;
  }

  static async createMCQ(mcq: Omit<MCQ, "id">): Promise<string> {
    const docRef = doc(collection(db, "mcqs"));
    await setDoc(docRef, mcq);
    return docRef.id;
  }

  static async updateMCQ(mcqId: string, updates: Partial<MCQ>): Promise<void> {
    const docRef = doc(db, "mcqs", mcqId);
    await updateDoc(docRef, updates);
  }

  static async deleteMCQ(mcqId: string): Promise<void> {
    const docRef = doc(db, "mcqs", mcqId);
    await deleteDoc(docRef);
  }

  // Puzzles
  static async getAllPuzzles(): Promise<Puzzle[]> {
    const querySnapshot = await getDocs(collection(db, "puzzles"));
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Puzzle
    );
  }

  static async getPuzzle(puzzleId: string): Promise<Puzzle | null> {
    const docRef = doc(db, "puzzles", puzzleId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists()
      ? ({ id: docSnap.id, ...docSnap.data() } as Puzzle)
      : null;
  }

  static async getPuzzleByCheckpoint(checkpointId: string): Promise<Puzzle | null> {
    const querySnapshot = await getDocs(
      query(collection(db, "puzzles"), where("checkpoint", "==", checkpointId))
    );
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Puzzle;
  }

  static async createPuzzle(puzzle: Omit<Puzzle, "id">): Promise<string> {
    const docRef = doc(collection(db, "puzzles"));
    await setDoc(docRef, puzzle);
    return docRef.id;
  }

  static async updatePuzzle(
    puzzleId: string,
    updates: Partial<Puzzle>
  ): Promise<void> {
    const docRef = doc(db, "puzzles", puzzleId);
    await updateDoc(docRef, updates);
  }

  static async deletePuzzle(puzzleId: string): Promise<void> {
    const docRef = doc(db, "puzzles", puzzleId);
    await deleteDoc(docRef);
  }

  // Admins
  static async getAllAdmins(): Promise<Admin[]> {
    const querySnapshot = await getDocs(collection(db, "admin"));
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Admin
    );
  }

  static async createAdmin(admin: Omit<Admin, "id">): Promise<string> {
    const docRef = doc(collection(db, "admins"));
    await setDoc(docRef, admin);
    return docRef.id;
  }

  // Real-time listeners
  static subscribeToTeams(callback: (teams: Team[]) => void): () => void {
    const q = query(collection(db, "teams"), orderBy("totalPoints", "desc"));
    return onSnapshot(q, (querySnapshot) => {
      const teams = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Team
      );
      callback(teams);
    });
  }

  static subscribeToTeam(
    teamId: string,
    callback: (team: Team | null) => void
  ): () => void {
    const docRef = doc(db, "teams", teamId);
    return onSnapshot(docRef, (docSnap) => {
      const team = docSnap.exists()
        ? ({ id: docSnap.id, ...docSnap.data() } as Team)
        : null;
      callback(team);
    });
  }

  // Helper methods for team game flow
  static async getActiveTeams(): Promise<Team[]> {
    const teams = await this.getAllTeams();
    return teams.filter(team => team.isActive);
  }

  static async getTeamByUsername(username: string): Promise<Team | null> {
    const teams = await this.getAllTeams();
    const team = teams.find(team => team.username === username);
    return team || null;
  }

  // Helper methods for random data selection
  static async getRandomMCQ(): Promise<MCQ | null> {
    const allMCQs = await this.getAllMCQs();
    if (allMCQs.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * allMCQs.length);
    return allMCQs[randomIndex];
  }

  static async getPuzzlesByCheckpointIds(checkpointIds: string[]): Promise<(Puzzle | null)[]> {
    const puzzles = await Promise.all(
      checkpointIds.map(id => this.getPuzzle(id))
    );
    return puzzles;
  }

  // Batch update for team progress (useful for admin operations)
  static async updateMultipleTeams(updates: Array<{teamId: string; data: Partial<Team>}>): Promise<void> {
    const updatePromises = updates.map(update => 
      this.updateTeam(update.teamId, update.data)
    );
    await Promise.all(updatePromises);
  }
}
