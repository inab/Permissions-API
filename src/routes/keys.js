import { version } from '../../package.json';
import { Router } from 'express';
import { getKeyStore } from '../utils/utils';

export default () => {
	let api = Router();

	api.get('/', async (req, res) => {
        const keyStore = await getKeyStore();
        res.send(keyStore.toJSON())
    })

	return api;
}
