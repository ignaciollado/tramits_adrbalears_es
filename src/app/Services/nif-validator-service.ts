import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class NifValidatorService {

  private dniRegex = /^[XYZ]?\d{7,8}[A-Z]$/;
  private cifRegex = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;

  constructor() {}

validateDniNie(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toUpperCase();
    if (!value) return null;

    const dniRegex = /^[XYZ]?\d{7,8}[A-Z]$/;
    return dniRegex.test(value) ? null : { invalidDniNie: true };
  };
}

validateCif(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toUpperCase();
    if (!value) return null;

    const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
    return cifRegex.test(value) ? null : { invalidCif: true };
  };
}

}
