# Динамический конвертер валют

❗ Обязательно ознакомьтесь с [Инструкцией применения скрипта Динамический конвертер валют для верстальщика.](https://www.notion.so/18feb8d3856080d9b0ebcc44c55f0d78?pvs=21)

## Общая информация

- Модуль "Динамический конвертер валют" предназначен для автоматической конвертации и форматирования денежных сумм на лендингах;
- Скрипт решает задачу корректного отображения цен в различных валютах с учетом актуальных курсов обмена;
- Модуль состоит из двух основных JavaScript-файлов;
- Поддерживается многоязычность и различные форматы отображения денежных сумм

## Архитектура модуля

### Структура файлов

- `CurrencyConverter.js` — основной класс, реализующий логику конвертации и форматирования;
- `main.js` — точка входа, инициализация класса CurrencyConverter.

### Принцип работы

1. При загрузке страницы создается экземпляр класса `CurrencyConverter`;
2. Скрипт проверяет наличие необходимых глобальных переменных;
3. После загрузки DOM выполняется поиск элементов с атрибутами `data-js-deposit*`;
4. Запрашиваются актуальные курсы валют с внешних API;
5. Для каждого найденного элемента выполняется конвертация базовой суммы и форматирование результата;
6. Результат помещается в содержимое элементов.

## Технические детали модуля

### Глобальные переменные

Скрипт использует следующие глобальные переменные, которые должны быть определены до его инициализации (обычно в блоке `<head>`):

| Переменная               | Назначение                     | Пример значения         |
| ------------------------ | ------------------------------ | ----------------------- |
| `CURRENCY_DEFAULT`       | Код целевой валюты             | `'USD'`, `'GBP'`        |
| `CURRENCY_WORD`          | Словесное обозначение валюты   | `'dollars'`, `'pounds'` |
| `CURRENCY_FORMAT`        | Локаль для форматирования      | `'en-US'`, `'ru-RU'`    |
| `CURRENCY_SIGN_LOCATION` | Позиция символа валюты         | `'before'`, `'after'`   |
| `VALUE_SEPARATOR`        | Пробел между суммой и символом | `true`, `false`         |
| `FIXED_AMOUNT_EUR`       | Базовая сумма в евро           | `250`                   |

### API для курсов валют

Модуль использует два внешних API для получения курсов валют:

```jsx
this.BASE_URLS = [
  'https://open.er-api.com/v6/latest/EUR', // Основной источник
  'https://api.exchangerate-api.com/v4/latest/EUR', // Запасной источник
];
```

В случае недоступности первого API скрипт автоматически пытается использовать второй.

## Алгоритмы и особенности реализации

### Алгоритм выбора API

1. Скрипт пытается получить данные с первого URL из `BASE_URLS`
2. Если запрос неуспешен, происходит переход ко второму URL

### Алгоритм обработки элементов

1. Для каждого элемента с атрибутами `data-js-deposit*`:
   - Определяется базовая сумма из `FIXED_AMOUNT_EUR`
   - Проверяется наличие атрибута `data-js-deposit-round-up`
   - В зависимости от наличия других атрибутов применяется соответствующий метод обработки
   - Результат записывается в `textContent` элемента

```jsx
// Пример логики обработки атрибутов
if (element.hasAttribute('data-js-deposit')) {
  let convertedAmount = amount * rates[countryCode];
  const roundedAmount = this.roundToNearest10(convertedAmount);
  if (roundUp) {
    convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
  }
  element.textContent = this.formatCurrency(convertedAmount, countryCode, false, false);
  return;
}
```

## Процесс изменения и обновления модуля

### Добавление нового типа форматирования

1. Определите новый атрибут (например, `data-js-deposit-new-format`)
2. Добавьте селектор атрибута в конструктор:

```jsx
this.depositElements = document.querySelectorAll(
  `${selector},
    [data-js-deposit],
    [data-js-deposit-multiply],
    ...
    [data-js-deposit-new-format]`
);
```

1. Создайте новый метод форматирования при необходимости:

```jsx
formatNewFormat(number, currencyCode) {
// Логика форматирования
  return formattedValue;
}
```

1. Добавьте обработку нового атрибута в `updateConvertedAmount()`:

```jsx
const newFormatValue = element.getAttribute('data-js-deposit-new-format');
if (newFormatValue !== null) {
  amount *= parseFloat(newFormatValue) || 1;
  let convertedAmount = amount * rates[countryCode];
  if (roundUp) {
    convertedAmount = this.roundToTwoSignificantDigits(convertedAmount);
  }
  element.textContent = this.formatNewFormat(convertedAmount, countryCode);
  return;
}
```

## Обновление репозитория

1. Добавьте изменённые файлы в индекс:

   ```bash
   git add .
   ```

2. Создайте коммит с описанием внесённых изменений:

   ```bash
   git commit -m "Ваше описание изменений"
   ```

3. Отправьте изменения в удалённый репозиторий:

   ```bash
   git push
   ```

4. Обновите [документацию для верстальщиков](https://www.notion.so/18feb8d3856080d9b0ebcc44c55f0d78?pvs=21) при необходимости.
