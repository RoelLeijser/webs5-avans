declare namespace Express {
  export interface Request {
    user: JwtUser;
  }
  export interface Response {
    user: JwtUser;
  }
}

interface JwtUser {
  id: string;
  email: string;
  role: string;
}
