import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PasswordGeneratorService {

  private readonly uppercase = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
  private readonly lowercase = 'abcdefghijkmnpqrstuvwxyz';
  private readonly numbers = '123456789';
  private readonly symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  generatePassword(length: number = 8): string {
    if (length < 4) {
      throw new Error('La longitud mínima debe ser 4 para cumplir con los requisitos.');
    }

    const getRandomChar = (chars: string) =>
      chars[Math.floor(Math.random() * chars.length)];

    const requiredChars = [
      getRandomChar(this.uppercase),
      getRandomChar(this.numbers),
      getRandomChar(this.symbols),
      getRandomChar(this.lowercase)
    ];

    const allChars = this.uppercase + this.lowercase + this.numbers + this.symbols;
    const remainingLength = length - requiredChars.length;

    for (let i = 0; i < remainingLength; i++) {
      requiredChars.push(getRandomChar(allChars));
    }

    // Mezclar los caracteres y eliminar espacios por seguridad
    return requiredChars
      .sort(() => Math.random() - 0.5)
      .join('')
      .replace(/\s/g, ''); // Elimina cualquier espacio en blanco, por si acaso
  }
}
