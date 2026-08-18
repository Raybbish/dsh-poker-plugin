/**
 * Ambient declaration for the hand-written browser bundle: the frontend tests
 * import it for its side effect (registering the __ModuleLoader__ factory).
 */
declare module "*client.js" {
  const value: unknown;
  export default value;
}
