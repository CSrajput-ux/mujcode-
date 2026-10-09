import { Judge0ExecutionProvider } from './Judge0ExecutionProvider.js';
import { SqlExecutionProvider } from './SqlExecutionProvider.js';

const judge0Provider = new Judge0ExecutionProvider();
const sqlProvider = new SqlExecutionProvider();

export class ExecutionProviderFactory {
  /**
   * Determine if a given language string is SQL
   * @param {string} language
   * @returns {boolean}
   */
  static isSql(language) {
    if (!language) return false;
    const clean = String(language).toLowerCase().trim();
    return clean === 'sql' || clean === 'sqlite' || clean === 'sqlite3';
  }

  /**
   * Return appropriate execution provider for the given language
   * @param {string} language
   * @returns {import('./BaseExecutionProvider.js').BaseExecutionProvider}
   */
  static getProvider(language) {
    if (this.isSql(language)) {
      return sqlProvider;
    }
    return judge0Provider;
  }

  /**
   * Return direct reference to SQL provider
   */
  static getSqlProvider() {
    return sqlProvider;
  }

  /**
   * Return direct reference to Judge0 provider
   */
  static getJudge0Provider() {
    return judge0Provider;
  }

  /**
   * Get all supported languages across all providers
   */
  static async getAllSupportedLanguages() {
    const [judge0Langs, sqlLangs] = await Promise.all([
      judge0Provider.getSupportedLanguages().catch(() => []),
      sqlProvider.getSupportedLanguages().catch(() => [])
    ]);

    return [...sqlLangs, ...judge0Langs];
  }

  /**
   * Check health of all providers
   */
  static async checkAllHealth() {
    const [judge0Health, sqlHealth] = await Promise.all([
      judge0Provider.checkHealth(),
      sqlProvider.checkHealth()
    ]);

    return {
      healthy: judge0Health.healthy && sqlHealth.healthy,
      providers: {
        judge0: judge0Health,
        sql: sqlHealth
      }
    };
  }
}
