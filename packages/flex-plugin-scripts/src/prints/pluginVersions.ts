import { logger, semver } from 'flex-dev-utils';
import { printObjectArray } from 'flex-dev-utils/dist/table';

import { AssetVersion, Visibility } from '../clients/serverless-types';
import { Order } from '../scripts/list';

interface DisplayList {
  type: string;
  version: string;
  url: string;
}

const VERSION_MATCH_REGEX = /^\/plugins\/.*\/(.*)\/bundle.js$/;
const warningMsg = 'You plugin does not follow SemVer versioning; the list below may not be ordered.';

/**
 * Prints the list of versions of the plugin in the provided order
 *
 * @param domainName  the Twilio Runtime domain
 * @param versions    the list of versions
 * @param order       the order to display the result
 */
export default (domainName: string, versions: AssetVersion[], order: Order) => {
  const list: DisplayList[] = versions
    .map((version) => {
      const match = version.path.match(VERSION_MATCH_REGEX);

      return {
        type: version.visibility === Visibility.Protected ? 'Private' : 'Public',
        version: match ? match[1] : 'N/A',
        url: `https://${domainName}${version.path}`,
      };
    });

  const isSemver = list.every((v) => semver.valid(v.version) !== null);
  let rows;

  if (!isSemver) {
    logger.warning(warningMsg);
    rows = list;
  } else {
    const _list = list.map((v) => v.version);
    const sortedVersions = order === 'asc' ? semver.sort(_list) : semver.rsort(_list);
    rows = sortedVersions.map((version) => list.find((v) => v.version === version) as DisplayList);
  }

  logger.newline();
  printObjectArray(rows);
  logger.newline();
};
