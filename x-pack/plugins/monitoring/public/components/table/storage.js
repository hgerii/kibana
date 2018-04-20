/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { get, set } from 'lodash';
import { STORAGE_KEY } from '../../../common/constants';

export const tableStorageGetter = keyPrefix => {
  return storage => {
    const localStorageData = storage.get(STORAGE_KEY) || {};
    const filterText = get(localStorageData, [ keyPrefix, 'filterText' ]);
    const pageIndex  = get(localStorageData, [ keyPrefix, 'pageIndex' ]);
    const sortKey    = get(localStorageData, [ keyPrefix, 'sortKey' ]);
    const sortOrder  = get(localStorageData, [ keyPrefix, 'sortOrder' ]);

    return { pageIndex, filterText, sortKey, sortOrder };
  };
};

export const tableStorageSetter = keyPrefix => {
  return (storage, { filterText, pageIndex, sortKey, sortOrder }) => {
    const localStorageData = storage.get(STORAGE_KEY) || {};

    set(localStorageData, [ keyPrefix, 'filterText' ], filterText || undefined); // don`t store empty data
    set(localStorageData, [ keyPrefix, 'pageIndex' ], pageIndex || undefined);
    set(localStorageData, [ keyPrefix, 'sortKey' ], sortKey || undefined);
    set(localStorageData, [ keyPrefix, 'sortOrder' ], sortOrder || undefined);

    storage.set(STORAGE_KEY, localStorageData);

    return localStorageData;
  };
};
