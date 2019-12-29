/** Interface for an object that is allowed to have any property */
export interface FlexObject {
  [key: string]: any;
}

/**
 * returns the desired language text using identifier or empty text
 * @param {FlexObject} multiLanguageObject - the multi language object
 * @param {string} languageIdentifier - the language identifier
 * @returns {string} - the native language text
 */
export function getNativeLanguageText(multiLanguageObject: FlexObject, languageIdentifier: string) {
  return multiLanguageObject[languageIdentifier] || '';
}
