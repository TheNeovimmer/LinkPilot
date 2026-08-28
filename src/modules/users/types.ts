export interface ProfileDTO {
  userId: string;
  displayName: string | null;
  title: string | null;
  location: string | null;
  linkedinUrl: string | null;
  tone: string;
  goals: unknown;
  preferences: unknown;
  email: string;
  emailVerified: boolean;
  image: string | null;
  updatedAt: Date;
}
