import fs from 'fs';
import jose from 'node-jose';

module.exports = function() { 
	const keyStore = jose.JWK.createKeyStore()
	keyStore.generate('RSA', 2048, {alg: 'RS256', use: 'sig' })
  		.then(result => {
    			fs.writeFileSync(
      				'./src/keys.json', 
      				JSON.stringify(keyStore.toJSON(true), null, '  ')
    			)
  	})
}
