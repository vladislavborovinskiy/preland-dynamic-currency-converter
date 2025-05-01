export default class CurrencyConverter {
  constructor(selector) {
    this.BASE_URLS = [
      'https://open.er-api.com/v6/latest/EUR', // Main source
      'https://api.exchangerate-api.com/v4/latest/EUR', // Backup source
    ];

    this.depositElements = document.querySelectorAll(
      `${selector}, 
				[data-js-deposit], 
				[data-js-deposit-multiply], 
				[data-js-deposit-multiply-word], 
				[data-js-deposit-multiply-round], 
				[data-js-deposit-multiply-bignumber], 
				[data-js-deposit-multiply-bignumber-noword], 
				[data-js-deposit-round-up]`
    );

    document.addEventListener('DOMContentLoaded', () => {
      if (this.validateGlobalVariables()) {
        this.init();
      }
    });
  }

  validateGlobalVariables() {
    return (
      typeof CURRENCY_DEFAULT !== 'undefined' &&
      typeof FIXED_AMOUNT_EUR !== 'undefined' &&
      typeof CURRENCY_SIGN_LOCATION !== 'undefined' &&
      typeof CURRENCY_FORMAT !== 'undefined' &&
      typeof VALUE_SEPARATOR !== 'undefined' &&
      typeof CURRENCY_WORD !== 'undefined' &&
      this.depositElements.length > 0
    );
  }

  async fetchRates() {
    for (const url of this.BASE_URLS) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}`);

        const data = await response.json();
        return data.rates || data;
      } catch (error) {
        console.warn(`API unavailable: ${url}`, error);
      }
    }

    throw new Error('All APIs are unavailable');
  }

  async updateConvertedAmount() {
    try {
      const rates = await this.fetchRates();
      const countryCode = CURRENCY_DEFAULT.toUpperCase();

      if (!rates[countryCode]) {
        this.depositElements.forEach((element) => {
          element.textContent = '';
        });
        return;
      }

      this.depositElements.forEach((element) => {
        let amount = FIXED_AMOUNT_EUR;
        const roundUp = element.hasAttribute('data-js-deposit-round-up');

        if (element.hasAttribute('data-js-deposit')) {
          let convertedAmount = amount * rates[countryCode];
          const roundedAmount = this.roundToNearest10(convertedAmount);
          if (roundUp) {
            convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
          }
          element.textContent = this.formatCurrency(convertedAmount, countryCode, false, false);
          return;
        }

        const titleMultiplier = element.getAttribute('data-js-deposit-multiply-round');
        const wordMultiplier = element.getAttribute('data-js-deposit-multiply-word');
        const multiplier = element.getAttribute('data-js-deposit-multiply');
        const bigNumberMultiplier = element.getAttribute('data-js-deposit-multiply-bignumber');
        const bigNumberNoWordMultiplier = element.getAttribute(
          'data-js-deposit-multiply-bignumber-noword'
        );

        if (titleMultiplier !== null) {
          amount *= parseFloat(titleMultiplier) || 1;
          let convertedAmount = amount * rates[countryCode];
          const roundedAmount = this.roundToSignificantDigits(convertedAmount);
          if (roundUp) {
            convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
          }
          element.textContent = this.formatCurrency(convertedAmount, countryCode, false, true);
          return;
        }

        if (wordMultiplier !== null) {
          amount *= parseFloat(wordMultiplier) || 1;
          let convertedAmount = amount * rates[countryCode];
          if (roundUp) {
            convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
          }
          element.textContent = this.formatCurrency(convertedAmount, countryCode, true, false);
          return;
        }

        if (bigNumberMultiplier !== null) {
          amount *= parseFloat(bigNumberMultiplier) || 1;
          let convertedAmount = amount * rates[countryCode];
          if (roundUp) {
            convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
          }
          element.textContent = this.formatBigNumber(convertedAmount);
          return;
        }

        if (bigNumberNoWordMultiplier !== null) {
          amount *= parseFloat(bigNumberNoWordMultiplier) || 1;
          let convertedAmount = amount * rates[countryCode];
          if (roundUp) {
            convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
          }
          element.textContent = this.formatBigNumberNoWord(convertedAmount, countryCode);
          return;
        }

        if (multiplier !== null) {
          amount *= parseFloat(multiplier) || 1;
        }

        let convertedAmount = amount * rates[countryCode];

        if (roundUp) {
          convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
        }

        element.textContent = this.formatCurrency(convertedAmount, countryCode, false, false);
      });
    } catch (error) {
      this.depositElements.forEach((element) => {
        element.textContent = 'Course not available';
      });
    }
  }

  roundToTwoSignificantDigits(number) {
    if (number < 10) return Math.ceil(number);

    const exponent = Math.floor(Math.log10(number)) - 1;
    const scale = Math.pow(10, exponent);
    return Math.ceil(number / scale) * scale;
  }

  roundToSignificantDigits(number) {
    if (number === 0) return 0;
    const exponent = Math.floor(Math.log10(number));
    const scale = Math.pow(10, exponent - 1);
    return Math.round(number / scale) * scale;
  }

  roundToNearest10(number) {
    return Math.ceil(number / 10) * 10;
  }

  formatBigNumber(number) {
    return new Intl.NumberFormat(CURRENCY_FORMAT, {
      notation: 'compact',
      compactDisplay: 'long',
      maximumFractionDigits: 1,
    }).format(number);
  }

  formatBigNumberNoWord(number, currencyCode) {
    const formatter = new Intl.NumberFormat(CURRENCY_FORMAT, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: number >= 1000000 && number < 1000000000 ? 0 : 1,
    });

    const compactNumber = formatter
      .format(number)
      .replace(/[A-Za-zа-яА-Я]+/g, '')
      .replace(/\.$/, '')
      .trim();

    const symbol = this.getCurrencySymbol(currencyCode);
    const separator = VALUE_SEPARATOR ? ' ' : '';

    return CURRENCY_SIGN_LOCATION === 'after'
      ? `${compactNumber}${separator}${symbol}`
      : `${symbol}${separator}${compactNumber}`;
  }

  getCurrencySymbol(currencyCode) {
    const tempFormat = new Intl.NumberFormat(CURRENCY_FORMAT, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const parts = tempFormat.formatToParts(0);
    const currencyPart = parts.find((part) => part.type === 'currency');
    return currencyPart?.value || '';
  }

  formatCurrency(amount, currencyCode, useWord = false, roundNumber = false) {
    const finalAmount = roundNumber ? this.roundToSignificantDigits(amount) : amount;

    if (useWord) {
      const numberFormat = new Intl.NumberFormat(CURRENCY_FORMAT, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
      const formattedNumber = numberFormat.format(finalAmount);
      return `${formattedNumber} ${CURRENCY_WORD}`;
    }

    const formatter = new Intl.NumberFormat(CURRENCY_FORMAT, {
      style: 'decimal',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });

    const formattedNumber = formatter.format(finalAmount);
    const symbol = this.getCurrencySymbol(currencyCode);
    const separator = VALUE_SEPARATOR ? ' ' : '';

    return CURRENCY_SIGN_LOCATION === 'after'
      ? `${formattedNumber}${separator}${symbol}`
      : `${symbol}${separator}${formattedNumber}`;
  }

  init() {
    this.updateConvertedAmount();
  }
}
