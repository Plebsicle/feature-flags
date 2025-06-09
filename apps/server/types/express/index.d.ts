import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      userId?: string;
      userEmail?: string;
      userName?: string;
      userRole?: string;
      userOrganisationId? : string;
      userOrganisationSlug? : string
    };
  }
}