/**
 * Available message scope types.
 *
 * @type {Array<string>}
 */
const availableMessageTypes = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert'
];

/**
 * Parse a commit message
 *
 * @param {string} message
 * @param {Array} messageTypes
 * @returns {{scope: string, description: string, type: string, prNumber: string, hash: string,
 *     typeScope: string, isBreaking: boolean, original: string, message: string, length: number}}
 */
const parseCommitMessage = (message, messageTypes = availableMessageTypes) => {
  let output;

  const [hashTypeScope, ...descriptionEtAll] = message.trim().split(/:/);
  const [description, ...partialPr] = descriptionEtAll
    .join(' ')
    .trim()
    .split(/(\(#|#)/);
  const [hash, ...typeScope] = hashTypeScope.replace(/!$/, '').trim().split(/\s/);
  const [type, scope = ''] = typeScope.join(' ').trim().split('(');

  output = {
    hash,
    typeScope: typeScope.join(' ').trim() || undefined,
    type: (messageTypes.includes(type) && type) || undefined,
    scope: scope.split(')')[0] || undefined,
    description: description.trim() || undefined,
    prNumber: (partialPr.join('(#').trim() || '').replace(/\D/g, '') || undefined,
    isBreaking: /!$/.test(hashTypeScope)
  };

  if (!output.type || (output.type && !descriptionEtAll?.length)) {
    const [hashFallback, ...descriptionEtAllFallback] = message.trim().split(/\s/);
    const [descriptionFallback, ...partialPrFallback] = descriptionEtAllFallback.join(' ').trim().split(/\(#/);

    output = {
      hash: hashFallback,
      typeScope: undefined,
      type: undefined,
      scope: undefined,
      description: descriptionFallback.trim(),
      prNumber: (partialPrFallback.join('(#').trim() || '').replace(/\D/g, '') || undefined,
      isBreaking: undefined
    };
  }

  const updatedMessage = [
    `${output.typeScope || ''}${(output.isBreaking && '!') || ''}${(output.typeScope && ':') || ''}`,
    output.description
  ]
    .filter(value => !!value)
    .join(' ')
    .trim();

  const out = {
    ...output,
    messageLength: updatedMessage?.length || 0,
    message: updatedMessage,
    original: message
  };

  return out;
};

/**
 * Apply valid/invalid checks.
 *
 * @param {Array} parsedMessages
 * @param {object} options Default options, update accordingly
 * @param {Array|string|undefined} options.issueNumberExceptions An "undefined" or "false" or "falsy" value
 *     will ignore issue numbers. A string of "*" will allow every type. An array of issue types can be used
 *     to identify which commit message type scopes to ignore, i.e. ['chore', 'fix', 'build', 'perf'].
 *     See NPM conventional-commit-types for full listing options, https://bit.ly/2L0yr6I
 * @param {number} options.maxMessageLength Max length of the main message string. Messages considered "body"
 *     do not count against this limit.
 * @param {Array|string|undefined} options.typeScopeExceptions see options.issueNumberExceptions
 * @returns {Array}
 */
const messagesList = (
  parsedMessages,
  {
    issueNumberExceptions = ['build', 'chore', 'ci', 'docs', 'fix', 'perf', 'refactor', 'test'],
    maxMessageLength = 65,
    typeScopeExceptions = '*'
  } = {}
) =>
  parsedMessages.map(
    ({ messageLength = 0, type = null, scope = null, description = null, message = null, hash = null }) => {
      const typeValid =
        (type && 'valid') || 'INVALID: type (expected known types and format "<type>:" or "<type>(<scope>):")';

      let scopeException = !typeScopeExceptions || !typeScopeExceptions?.length || typeScopeExceptions === '*';

      if (!scopeException && Array.isArray(typeScopeExceptions)) {
        scopeException = typeScopeExceptions.includes(type);
      }

      const scopeValid = (scopeException && 'valid') || (scope && 'valid') || 'INVALID: scope';

      let issueNumberException =
        !issueNumberExceptions || !issueNumberExceptions?.length || issueNumberExceptions === '*';

      if (!issueNumberException && Array.isArray(issueNumberExceptions)) {
        issueNumberException = issueNumberExceptions.includes(type);
      }

      const isIssueNumber = /(^[a-zA-Z]+[/-]+[0-9]+)/.test(description);
      // Note: skip issueNumber validation if typeValid fails, this is on purpose
      const issueNumberValid =
        (typeValid !== 'valid' && 'valid') ||
        (issueNumberException && 'valid') ||
        (isIssueNumber && 'valid') ||
        'INVALID: issue number (expected format "<desc>/<number>" or "<desc>-<number>")';

      const descriptionValid = (description && 'valid') || 'INVALID: description (missing description)';

      const isDependabotCommit = message.includes('dependabot');

      const lengthValid =
        messageLength <= maxMessageLength || isDependabotCommit
          ? 'valid'
          : `INVALID: message length (${messageLength} > ${maxMessageLength})`;

      return {
        hash,
        commit: message,
        type: typeValid,
        scope: scopeValid,
        description: descriptionValid,
        issueNumber: issueNumberValid,
        length: lengthValid
      };
    }
  );

/**
 * If commits exist, lint them.
 *
 * @param {string} commits
 * @returns {{resultsArray: Array, resultsString: string}}
 */
const actionCommitCheck = commits => {
  const lintResults = { resultsArray: [], resultsString: '' };

  if (commits) {
    const updatedCommits = commits
      .trim()
      .replace(/\n/g, '')
      .replace(/\+\s/g, '\n')
      .replace(/\n/, '')
      .split(/\n/g)
      .filter(value => value !== '')
      .map(message => parseCommitMessage(message));
    let filteredResults = messagesList(updatedCommits);

    filteredResults.forEach(obj => {
      const updatedObj = obj;
      Object.entries(updatedObj).forEach(([key, value]) => {
        if (value === 'valid') {
          delete updatedObj[key];
        }
      });
    });

    filteredResults = filteredResults.filter(({ hash, commit, ...rest }) => Object.keys(rest).length > 0);
    lintResults.resultsArray = filteredResults;
    lintResults.resultsString = JSON.stringify(filteredResults, null, 2);
  }

  return lintResults;
};

module.exports = actionCommitCheck;
