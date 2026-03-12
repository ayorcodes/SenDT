import { IsString, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';

export class ResolveAccountDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;
}

export class TransferDto {
  @IsNumberString()
  amount: string; // in NGN

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
