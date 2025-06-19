import { WBK } from 'wikibase-sdk';

const wikidataSdk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql'
});

export default wikidataSdk;
