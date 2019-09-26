import { AuthConfig } from 'flex-dev-utils/dist/credentials';
import ConfigurationClient from '../configurations';

describe('ConfigurationClient', () => {
  const serviceSid = 'ZS00000000000000000000000000000000';
  const anotherSid = 'ZS00000000000000000000000000000001';
  const accountSid = 'AC00000000000000000000000000000000';
  const auth: AuthConfig = {
    accountSid,
    authToken: 'abc',
  };

  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    jest.clearAllMocks();
  });

  describe('getBaseUrl', () => {
    it('should get prod baseUrl', () => {
      // @ts-ignore
      const baseUrl = ConfigurationClient.getBaseUrl();

      expect(baseUrl).toEqual('https://flex-api.twilio.com/v1');
    });

    it('should get dev baseUrl', () => {
      process.env.TWILIO_SERVERLESS_REALM = 'dev';
      // @ts-ignore
      const baseUrl = ConfigurationClient.getBaseUrl();

      expect(baseUrl).toEqual('https://flex-api.dev.twilio.com/v1');
    });

    it('should throw error if invalid realm is provided', (done) => {
      try {
        process.env.TWILIO_SERVERLESS_REALM = 'invalid';
        // @ts-ignore
        ConfigurationClient.getBaseUrl();
      } catch (e) {
        done();
      }
    });
  });

  describe('get', () => {
    it('should get configuration', async () => {
      const client = new ConfigurationClient(auth);
      const config = { account_sid: accountSid, serverless_service_sids: [serviceSid] };
      // @ts-ignore
      const get = jest.spyOn(client.http, 'get').mockResolvedValue(config);

      const result = await client.get();

      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(ConfigurationClient.BaseUrl);
      expect(result).toEqual(config);
    });
  });

  describe('update', () => {
    it('should update configuration', async () => {
      const client = new ConfigurationClient(auth);
      const payload = { account_sid: accountSid, serverless_service_sids: [serviceSid] };
      // @ts-ignore
      const post = jest.spyOn(client.http, 'post').mockResolvedValue('updated');

      const result = await client.update(payload);

      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith(ConfigurationClient.BaseUrl, payload);
      expect(result).toEqual('updated');
    });
  });

  describe('getServiceSids', () => {
    it('should return empty array if key is null', async () => {
      const client = new ConfigurationClient(auth);
      const config = { account_sid: accountSid, serverless_service_sids: null };
      // @ts-ignore
      const get = jest.spyOn(client.http, 'get').mockResolvedValue(config);

      const sids = await client.getServiceSids();

      expect(get).toHaveBeenCalledTimes(1);
      expect(sids).toEqual([]);
    });

    it('should return sids', async () => {
      const client = new ConfigurationClient(auth);
      const config = { account_sid: accountSid, serverless_service_sids: [serviceSid] };
      // @ts-ignore
      const get = jest.spyOn(client.http, 'get').mockResolvedValue(config);

      const sids = await client.getServiceSids();

      expect(get).toHaveBeenCalledTimes(1);
      expect(sids).toEqual([serviceSid]);
    });
  });

  describe('registerSid', () => {
    it('should append sid to existing sids', async () => {
      const client = new ConfigurationClient(auth);
      const config = { account_sid: accountSid, serverless_service_sids: [serviceSid] };
      const updated = { account_sid: accountSid, serverless_service_sids: [serviceSid, anotherSid] };

      const get = jest.spyOn(client, 'get').mockResolvedValue(config);
      const update = jest.spyOn(client, 'update').mockResolvedValue(updated);

      const result = await client.registerSid(anotherSid);

      expect(get).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(updated);
      expect(result).toEqual(updated);
    });

    it('should add the first sid to null', async () => {
      const client = new ConfigurationClient(auth);
      const config = { account_sid: accountSid, serverless_service_sids: null };
      const updated = { account_sid: accountSid, serverless_service_sids: [serviceSid] };

      const get = jest.spyOn(client, 'get').mockResolvedValue(config);
      const update = jest.spyOn(client, 'update').mockResolvedValue(updated);

      const result = await client.registerSid(serviceSid);

      expect(get).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(updated);
      expect(result).toEqual(updated);
    });

    it('should return the original config if sid is already added', async () => {
      const client = new ConfigurationClient(auth);
      const config = { account_sid: accountSid, serverless_service_sids: [serviceSid] };

      const get = jest.spyOn(client, 'get').mockResolvedValue(config);
      const update = jest.spyOn(client, 'update').mockResolvedValue(config);

      const result = await client.registerSid(serviceSid);

      expect(get).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
      expect(result).toEqual(config);
    });
  });
});