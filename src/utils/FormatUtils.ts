const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/**
 * Function that searches a specific criteria inside a string term with
 * case insensitive and without accents for a character matching search.
 * @param searchCriteria is the term we'll be looking to match inside term
 * @param term the string being looked up
 * @returns
 */
const isIncludedIn = (searchCriteria: string, term: string) =>
  searchCriteria.length
    ? removeAccents(term)
        .toLowerCase()
        .includes(removeAccents(searchCriteria).toLowerCase())
    : true;

export { removeAccents, isIncludedIn };
