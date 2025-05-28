import argon2 from 'argon2';

export async function hashPassword(userPassword: string): Promise<string> {
  return await argon2.hash(userPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,    // 64 MiB
    timeCost: 4,            // number of iterations
    parallelism: 2,         // number of threads
    hashLength: 32          // output hash length in bytes
  });
}

export async function comparePassword(userPassword: string, storedPassword: string): Promise<boolean> {
  return await argon2.verify(storedPassword, userPassword);
}
