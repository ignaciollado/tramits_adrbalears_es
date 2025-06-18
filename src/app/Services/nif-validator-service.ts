import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class NifValidatorService {

  private dniRegex = /^[XYZ]?\d{7,8}[A-Z]$/;
  private cifRegex = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;

  constructor() {}

  validateNifOrCif(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toUpperCase();

      if (!value) {
        return null; // Let required validator handle empty case
      }

      const isDni = this.dniRegex.test(value);
      const isCif = this.cifRegex.test(value);

      if (!isDni && !isCif) {
        return { invalidNifOrCif: true };
      }

      return null;
    };
  }
}
