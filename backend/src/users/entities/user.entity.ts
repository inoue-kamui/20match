export enum Gender {
  Male = 'male',
  Female = 'female'
}

export interface User {
  id: string;
  nickname: string;
  gender: Gender;
  age: number;
  prefecture: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  nickname: string;
  gender: Gender;
  age: number;
  prefecture: string;
}
