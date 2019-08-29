import reducerRegistry from '@onaio/redux-reducer-registry';
import { values } from 'lodash';
import { FlushThunks } from 'redux-testkit';
import store from '../../index';
import reducer, {
  fetchClients,
  getClientById,
  getClients,
  getClientsArray,
  getClientsIdArray,
  getHouseholdById,
  getHouseholdsArray,
  getHouseholdsById,
  reducerName,
  removeClientsAction,
} from '../clients';
import * as fixtures from '../tests/fixtures';

reducerRegistry.register(reducerName, reducer);

describe('reducers/clients', () => {
  let flushThunks;

  beforeEach(() => {
    flushThunks = FlushThunks.createMiddleware();
    jest.resetAllMocks();
  });

  it('selectors work for empty initialState', () => {
    expect(getClients(store.getState())).toEqual({});
    expect(getClientsArray(store.getState())).toEqual([]);
    expect(getClientsIdArray(store.getState())).toEqual([]);
    expect(getClientById(store.getState(), 'some-id')).toBeNull();
    expect(getHouseholdsById(store.getState())).toEqual({});
    expect(getHouseholdsArray(store.getState())).toEqual([]);
    expect(getHouseholdById(store.getState(), 'test-id')).toBeNull();
  });

  it('fetches clients correctly', () => {
    store.dispatch(fetchClients([fixtures.client1, fixtures.client2]));
    expect(getClients(store.getState())).toEqual({
      '9b67a82d-dac7-40c0-85aa-e5976339a6b6': fixtures.client1,
      'a30116d5-0612-419e-9b93-00c87df4ffbb': fixtures.client2,
    });
    expect(getClientsArray(store.getState())).toEqual(values([fixtures.client1, fixtures.client2]));
    expect(getClientsIdArray(store.getState())).toEqual(
      [fixtures.client1, fixtures.client2].map(client => client._id)
    );
    expect(getClientById(store.getState(), '9b67a82d-dac7-40c0-85aa-e5976339a6b6')).toEqual(
      fixtures.client1
    );
  });

  it('removes clients', () => {
    store.dispatch(fetchClients([fixtures.client1, fixtures.client2]));
    let numberOfClients = getClientsArray(store.getState()).length;
    expect(numberOfClients).toEqual(2);

    store.dispatch(removeClientsAction);
    numberOfClients = getClientsArray(store.getState()).length;
    expect(numberOfClients).toEqual(0);
  });

  it('Adds new clients to store instead of overwriting existing ones', () => {
    store.dispatch(removeClientsAction);
    store.dispatch(fetchClients([fixtures.client1]));
    let numberOfClients = getClientsArray(store.getState()).length;
    expect(numberOfClients).toEqual(1);

    store.dispatch(fetchClients([fixtures.client2]));
    numberOfClients = getClientsArray(store.getState()).length;
    expect(numberOfClients).toEqual(2);
  });
});
