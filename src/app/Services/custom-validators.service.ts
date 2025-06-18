import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomValidatorsService {

  /* DNI/NIE */
  private dniLetters: string[] = [
    'T',
    'R',
    'W',
    'A',
    'G',
    'M',
    'Y',
    'F',
    'P',
    'D',
    'X',
    'B',
    'N',
    'J',
    'Z',
    'S',
    'Q',
    'V',
    'H',
    'L',
    'C',
    'K',
    'E',
  ]

  private nieInitialLetters: string[] = ['X', 'Y', 'Z']

  /* CIF */
  private organizationCode: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'N', 'P', 'Q', 'R', 'S', 'U', 'V', 'W']

  // Digito final numérico
  private numberControlDigit: string[] = ['A', 'B', 'E', 'H'];

  // Dígito final letra
  private letterControlDigit: string[] = ['P', 'Q', 'R', 'S', 'W', 'N'];

  // Listado de valores para letras. En caso de numérico, se cogerá el índice.
  private controlDigitList: string[] = [
    "J",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I"
  ]


  // Patrones para verificar antes de hacer validación si es un NIE, un DNI o un CIF
  // Estos patrones se sacaron en base a la página: https://regexr.com/
  private niePattern: RegExp = /^[XYZ]\d{7}$/
  private dniPattern: RegExp = /^\d{8}$/
  private cifPattern: RegExp = /^[ABCDEFGHJNPQRSUVW]\d{8}$/

  private isSettingValues = new BehaviorSubject<boolean>(false);

  cifValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

      // Evito validaciones infinitas tras setear un nuevo valor
      if (this.isSettingValues.value) {
        return null
      }

      let validData: any
      let data: string = control.value.toUpperCase()
      const initialLetter: string = data.charAt(0)

      if (data.length == 9 && this.organizationCode.includes(initialLetter)) {
        if (this.cifPattern.test(data)) {
          let oddList: any[] = [] // Impares
          let evenList: any[] = [] // Pares
          const cifNumeration: string[] = data.substring(1, 8).split("")

          cifNumeration.forEach((digit, i) => {
            (i + 1) % 2 === 0 ? evenList.push(digit) : oddList.push(digit)
          });


          // Cálculo de números pares: Suma de los mismos
          const sumEven: number = evenList.reduce((a, b) => parseInt(a) + parseInt(b))

          // Cálculo de números impares: Suma de dígitos tras multiplicarlos * 2 ==> 10 -> 1+0
          let sumOdd: number = 0;
          oddList.map(odd => {
            let oddNumber = parseInt(odd) * 2
            if (oddNumber > 9) {
              oddNumber -= 9
            }

            sumOdd += oddNumber
          })

          // Suma total y cálculo de dígito/letra
          const totalSum: number = sumEven + sumOdd

          // Si es igual a 10, el valor final es 0
          const validControlDigit: number = (10 - (totalSum % 10) == 10) ? 0 : (10 - (totalSum % 10))

          if (this.numberControlDigit.includes(initialLetter)) {
            validData = `${initialLetter}${cifNumeration.join("")}${validControlDigit}`.toString() // Valor numérico
          } else if (this.letterControlDigit.includes(initialLetter)) {
            validData = `${initialLetter}${cifNumeration.join("")}${this.controlDigitList[validControlDigit]}`.toString() // Valor alfabético
          }
        }
      }

      if (validData != null) {
        this.isSettingValues.next(true)
        control.setValue(validData, { emitEvent: false })
        this.isSettingValues.next(false)
      } else {
        return { cifValidator: false }
      }

      return null

    }
  }


  dniNieValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (this.isSettingValues.value) {
        return null;
      }

      let validData: any
      let data: string = control.value
      if (!data) {
        return null
      }

      if (data.length == 9) {
        data = data.toUpperCase()
        if (this.niePattern.test(data.substring(0, 8))) {
          // Guardo la letra para añadirla posteriormente al resultado
          const nieInitialLetter: string = data.substring(0, 1)
          const nieNumbersWithoutLetters: string = data.substring(1, 8)
          const numericNie = parseInt(`${this.nieInitialLetters.indexOf(nieInitialLetter)}${nieNumbersWithoutLetters}`)
          const operationResidual = numericNie % 23
          validData = `${nieInitialLetter}${nieNumbersWithoutLetters}${this.dniLetters[operationResidual]}`

        } else if (this.dniPattern.test(data.substring(0, 8))) {
          const dniNumbersString: string = data.substring(0, 8)
          const dniNumbers = parseInt(dniNumbersString)
          const operationResidual = dniNumbers % 23
          validData = `${dniNumbers}${this.dniLetters[operationResidual]}`

        }
      }

      if (validData != null) {
        this.isSettingValues.next(true)
        control.setValue(validData, { emitEvent: false })
        this.isSettingValues.next(false)
      } else {
        return { dniNieValidator: false }
      }

      return null
    }
  }

}
