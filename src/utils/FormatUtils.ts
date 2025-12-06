export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Function that searches a specific criteria inside a string term with
 * case insensitive and without accents for a character matching search.
 * @param searchCriteria is the term we'll be looking to match inside term
 * @param term the string being looked up
 * @returns
 */
export function isIncludedIn(searchCriteria: string, term: string) {
  return searchCriteria.length
    ? removeAccents(term)
      .toLowerCase()
      .includes(removeAccents(searchCriteria).toLowerCase())
    : true;
}

export function nameInitials(name: string): string {
  const names = name.split(" ");

  if (names.length === 1) {
    return names[0].slice(0, 2);
  }

  if (names.length > 1) {
    return names
      .slice(0, 2)
      .map((name) => name[0])
      .join("");
  }

  return "?";
}

export function formatPhoneNumber(phoneNumber: string): string {
  const areaCodeLenght = phoneNumber.slice(3, 5) === "11" ? 2 : 3;

  // Format phone number with spaces and hyphen using splice
  const chars = phoneNumber.split("");
  chars.splice(2, 0, " "); // Country code
  chars.splice(4, 0, " "); // Nine
  chars.splice(5 + areaCodeLenght, 0, " "); // Area code
  chars.splice(12, 0, "-"); // Hyphen

  return "+" + chars.join("");
}
