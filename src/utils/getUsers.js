import KcAdminClient from 'keycloak-admin';
import { keycloakAdminCredentials } from '../config'

export default async () => {
    const kcAdminClient = new KcAdminClient({
        baseUrl: 'https://inb.bsc.es/auth',
        realmName: 'master'
    });

    await kcAdminClient.auth(keycloakAdminCredentials);

    // setInterval(() => kcAdminClient.auth(keycloakAdminCredentials), 300 * 1000);

    kcAdminClient.setConfig({
        realmName: 'IPC',
    });

    return await kcAdminClient.users.find();
}