package br.com.fleetmanager.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CpfValidator implements ConstraintValidator<Cpf, String> {

    @Override
    public boolean isValid(String cpf, ConstraintValidatorContext context) {
        if (cpf == null || cpf.isEmpty()) {
            return true;
        }

        cpf = cpf.replaceAll("[^0-9]", "");

        if (cpf.length() != 11) {
            return false;
        }

        if (cpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        int[] digits = cpf.chars().map(Character::getNumericValue).toArray();

        int firstDigit = calculateDigit(digits, 9);
        int secondDigit = calculateDigit(digits, 10);

        return firstDigit == digits[9] && secondDigit == digits[10];
    }

    private int calculateDigit(int[] digits, int position) {
        int sum = 0;
        for (int i = 0; i < position; i++) {
            sum += digits[i] * (position + 1 - i);
        }
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
} 