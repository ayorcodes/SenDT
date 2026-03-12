export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface TransferDto {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  narration?: string;
}

export interface ResolveAccountDto {
  bankCode: string;
  accountNumber: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    kycStatus: string;
  };
}
