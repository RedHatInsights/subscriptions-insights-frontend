import moxios from 'moxios';
import { serviceConfig } from '../serviceConfig';
import { generateHash } from '../helpers';

describe('ServiceConfig', () => {
  beforeEach(() => {
    moxios.install();
    moxios.stubRequest(/\/(test).*?/, {
      status: 200,
      responseText: 'success',
      timeout: 0
    });
  });

  afterEach(() => {
    moxios.uninstall();
    jest.clearAllMocks();
  });

  it('should have specific properties and methods', () => {
    expect(Object.keys(serviceConfig)).toMatchSnapshot('specific props and methods');
  });

  it('should handle producing a consistent service call configuration', async () => {
    const response = await serviceConfig.axiosServiceCall({
      cache: false,
      exposeCacheId: true,
      url: '/test/',
      params: { lorem: 'ipsum', dolor: 'sit' },
      schema: [successResponse => `${successResponse}-schema-transform`],
      transform: [successResponse => `${successResponse}-transform`]
    });

    expect(generateHash(response.request.config)).toMatchSnapshot('response config hash');
  });
});

describe('Cancel service calls', () => {
  beforeEach(() => {
    moxios.install();
    moxios.stubRequest(/\/(test).*?/, {
      status: 200,
      responseText: 'success',
      timeout: 0
    });
  });

  afterEach(() => {
    moxios.uninstall();
    jest.clearAllMocks();
  });

  it('should handle cancelling service calls', async () => {
    // Highlight cancel takes into account url and method
    await expect(
      Promise.all([
        serviceConfig.axiosServiceCall({ url: '/test/all', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/all', method: 'post', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/all', method: 'post', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/all', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/all', cancel: true })
      ])
    ).rejects.toMatchSnapshot('cancelled request, Promise.all');

    // Highlight cancel takes into account url and method
    await expect(
      Promise.allSettled([
        serviceConfig.axiosServiceCall({ url: '/test/allsettled', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/allsettled', method: 'post', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/allsettled', method: 'post', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/allsettled', cancel: true }),
        serviceConfig.axiosServiceCall({ url: '/test/allsettled', cancel: true })
      ])
    ).resolves.toMatchSnapshot('cancelled request, Promise.allSettled');
  });
});

describe('Cache service calls', () => {
  beforeEach(() => {
    moxios.install();
    moxios.stubRequest(/\/(test).*?/, {
      status: 200,
      responseText: 'success',
      timeout: 0
    });
  });

  afterEach(() => {
    moxios.uninstall();
    jest.clearAllMocks();
  });

  it('should handle caching service calls', async () => {
    const responses = [];

    // First, call an endpoint with set params
    const responseOne = await serviceConfig.axiosServiceCall({
      cache: true,
      url: '/test/',
      params: { lorem: 'ipsum', dolor: 'sit' },
      exposeCacheId: true
    });
    responses.push(
      `1. method=get, status=${responseOne.status}, cacheId=${responseOne.request.config.cacheId}, desc=initial call`
    );

    // Second, call the same endpoint with same params, expect a cached response, emulated 304
    const responseTwo = await serviceConfig.axiosServiceCall({
      cache: true,
      url: '/test/',
      params: { lorem: 'ipsum', dolor: 'sit' },
      exposeCacheId: true
    });
    responses.push(
      `2. method=get, status=${responseTwo.status}, cacheId=${responseTwo.request.config.cacheId}, desc=repeat 1st call and config`
    );

    // Third, updating config creates a new cache
    const responseThree = await serviceConfig.axiosServiceCall({
      cache: true,
      url: '/test/',
      params: { lorem: 'ipsum' },
      exposeCacheId: true
    });
    responses.push(
      `3. method=get, status=${responseThree.status}, cacheId=${responseThree.request.config.cacheId}, desc=updated config`
    );

    // Fourth, confirm cache isn't created for other methods, i.e. post
    const responseFour = await serviceConfig.axiosServiceCall({
      cache: true,
      method: 'post',
      url: '/test/',
      params: { lorem: 'ipsum' },
      exposeCacheId: true
    });
    responses.push(
      `4. method=post, status=${responseFour.status}, cacheId=${responseFour.request.config.cacheId}, desc=attempt post method`
    );

    // Fifth, confirm cache exists from responseThree
    const responseFive = await serviceConfig.axiosServiceCall({
      cache: true,
      url: '/test/',
      params: { lorem: 'ipsum' },
      exposeCacheId: true
    });
    responses.push(
      `5. method=get, status=${responseFive.status}, cacheId=${responseFive.request.config.cacheId}, desc=repeat 3rd call and config`
    );

    // Six, don't use a cache
    const responseSix = await serviceConfig.axiosServiceCall({
      cache: false,
      url: '/test/',
      params: { lorem: 'ipsum' },
      exposeCacheId: true
    });
    responses.push(
      `6. method=get, status=${responseSix.status}, cacheId=${responseSix.request.config.cacheId}, desc=no caching`
    );

    expect(responses).toMatchSnapshot('cached responses, emulated 304');
  });
});

describe('Transform service call responses', () => {
  beforeEach(() => {
    moxios.install();
    moxios.stubRequest(/\/(test).*?/, {
      status: 200,
      responseText: 'success',
      timeout: 0
    });
    moxios.stubRequest(/\/(error).*?/, {
      status: 404,
      responseText: 'error',
      timeout: 0
    });
  });

  afterEach(() => {
    moxios.uninstall();
    jest.clearAllMocks();
  });

  it('should handle transforming responses with schema transform', async () => {
    const responses = await Promise.allSettled([
      serviceConfig.axiosServiceCall({
        cache: true,
        url: '/test/',
        schema: [successResponse => `${successResponse}-schema-transform`]
      })
    ]);

    expect(responses.map(response => response.value.data)).toMatchSnapshot('schema');
  });

  it('should handle transforming success responses and errors', async () => {
    const responses = await Promise.allSettled([
      // success response and transform
      serviceConfig.axiosServiceCall({
        cache: true,
        url: '/test/',
        transform: [successResponse => `${successResponse}-transform`]
      }),

      // throw an error pass original API response
      serviceConfig.axiosServiceCall({
        cache: true,
        url: '/test/',
        transform: [
          () => {
            throw new Error('success response transform error');
          }
        ]
      })
    ]);

    expect(responses.map(response => response.value.data)).toMatchSnapshot('transformed success');
  });

  it('should handle transforming error responses and errors', async () => {
    const responses = await Promise.allSettled([
      // error response and transform
      serviceConfig.axiosServiceCall({
        cache: true,
        url: '/error/',
        transform: [
          successResponse => `${successResponse}-transform`,
          errorResponse => `${errorResponse}-error-transform`
        ]
      }),

      // throw an error pass original API response
      serviceConfig.axiosServiceCall({
        cache: true,
        url: '/error/',
        transform: [
          successResponse => `${successResponse}-transform`,
          () => {
            throw new Error('error response transform error');
          }
        ]
      })
    ]);

    expect(responses.map(({ reason }) => reason?.response?.data || reason.data)).toMatchSnapshot('transformed error');
  });

  it('should handle transforming responses with a cancel', async () => {
    const config = {
      cache: true,
      cancel: true,
      url: '/error/',
      transform: [
        successResponse => `${successResponse}-transform`,
        errorResponse => `${errorResponse}-cancel-transform`
      ]
    };

    const responses = await Promise.allSettled([
      serviceConfig.axiosServiceCall({
        ...config
      }),
      serviceConfig.axiosServiceCall({
        ...config
      })
    ]);

    expect(responses.map(({ reason }) => reason?.response?.data || reason.message)).toMatchSnapshot(
      'transformed cancel'
    );
  });
});

describe('Poll service calls', () => {
  beforeEach(() => {
    moxios.install();
    moxios.stubRequest(/\/(test|pollSuccess).*?/, {
      status: 200,
      responseText: 'success',
      timeout: 0
    });
    moxios.stubRequest(/\/(error|pollError).*?/, {
      status: 404,
      responseText: 'error',
      timeout: 0
    });
  });

  afterEach(() => {
    moxios.uninstall();
    jest.clearAllMocks();
  });

  it('should handle basic polling', async () => {
    const basicPollValidator = jest.fn();
    const basicOutput = await serviceConfig.axiosServiceCall(
      {
        cache: true,
        url: '/test/',
        poll: (response, count) => {
          basicPollValidator(response, count);
          return count === 1;
        }
      },
      { pollInterval: 0 }
    );

    expect(basicPollValidator).toHaveBeenCalledTimes(3);
    expect({
      validator: basicPollValidator.mock.calls.map(([response, count]) => ({
        success: {
          data: response.data,
          pollConfig: response.config.poll
        },
        count
      })),
      output: {
        pollConfig: basicOutput.config.poll,
        data: basicOutput.data
      }
    }).toMatchSnapshot('basic');
  });

  it('should handle basic polling error', async () => {
    const consoleSpyError = jest.spyOn(console, 'error');

    await serviceConfig.axiosServiceCall(
      {
        cache: false,
        url: '/test/',
        poll: () => {
          throw new Error('basic validation error');
        }
      },
      { pollInterval: 0 }
    );

    expect(consoleSpyError.mock.calls).toMatchSnapshot('error');
    consoleSpyError.mockClear();
  });

  it('should handle polling with a validate callback', async () => {
    const specificPollValidator = jest.fn();
    const specificOutput = await serviceConfig.axiosServiceCall(
      {
        cache: true,
        url: '/test/',
        poll: {
          validate: (response, count) => {
            specificPollValidator(response, count);
            return count === 1;
          }
        }
      },
      { pollInterval: 0 }
    );

    expect(specificPollValidator).toHaveBeenCalledTimes(3);
    expect({
      validator: specificPollValidator.mock.calls.map(([response, count]) => ({
        success: {
          data: response.data,
          pollConfig: response.config.poll
        },
        count
      })),
      output: {
        pollConfig: specificOutput.config.poll,
        data: specificOutput.data
      }
    }).toMatchSnapshot('callback');
  });

  it('should handle polling with a validate callback error', async () => {
    const consoleSpyError = jest.spyOn(console, 'error');

    await serviceConfig.axiosServiceCall(
      {
        cache: false,
        url: '/test/',
        poll: {
          validate: () => {
            throw new Error('status error');
          }
        }
      },
      { pollInterval: 0 }
    );

    expect(consoleSpyError.mock.calls).toMatchSnapshot('callback error');
    consoleSpyError.mockClear();
  });

  it('should handle polling with a status callback', async () => {
    const statusPoll = jest.fn();
    const statusOutput = await serviceConfig.axiosServiceCall(
      {
        cache: true,
        url: '/test/',
        poll: {
          validate: (response, count) => count === 1,
          status: (...args) => statusPoll(...args)
        }
      },
      { pollInterval: 0 }
    );

    // Note: The status callback is an independent async func fired out of sequence, we wait for it to resolve.
    await new Promise(resolve => {
      setTimeout(() => resolve(), 100);
    });

    expect(statusPoll).toHaveBeenCalledTimes(3);
    expect({
      status: statusPoll.mock.calls.map(([response, count]) => ({
        response: {
          error: response?.error,
          data: response?.data,
          pollConfig: response?.config.poll
        },
        count
      })),
      output: {
        data: statusOutput.data,
        pollConfig: statusOutput.config.poll
      }
    }).toMatchSnapshot('callback');
  });

  it('should handle polling with a status callback error', async () => {
    const consoleSpyError = jest.spyOn(console, 'error');

    await serviceConfig.axiosServiceCall(
      {
        cache: false,
        url: '/test/',
        poll: {
          validate: (response, count) => count === 3,
          status: () => {
            throw new Error('status error');
          }
        }
      },
      { pollInterval: 0 }
    );

    // Note: The status callback is an independent async func fired out of sequence, we wait for it to resolve.
    await new Promise(resolve => {
      setTimeout(() => resolve(), 100);
    });

    expect(consoleSpyError.mock.calls).toMatchSnapshot('callback error');
    consoleSpyError.mockClear();
  });

  it('should handle polling against a different service call path', async () => {
    const mockLocation = jest.fn().mockImplementation(() => '/pollSuccess/');
    const locationOutput = await serviceConfig.axiosServiceCall(
      {
        cache: true,
        url: '/test/',
        poll: {
          location: mockLocation,
          validate: (response, count) => count === 2
        }
      },
      { pollInterval: 0 }
    );

    expect(mockLocation).toHaveBeenCalledTimes(3);
    expect({
      validator: mockLocation.mock.calls.map(([success, count]) => ({
        success: {
          data: success.data,
          url: success.request.url,
          pollConfig: { ...success.config.poll, location: Function.prototype }
        },
        count
      })),
      output: {
        pollConfig: { ...locationOutput.config.poll, location: Function.prototype },
        data: locationOutput.data
      }
    }).toMatchSnapshot('different service call');
  });

  it('should handle polling against a different service call path error and status callback', async () => {
    const statusErrorPoll = jest.fn();
    await serviceConfig.axiosServiceCall(
      {
        cache: false,
        url: '/test/',
        poll: {
          location: '/pollError',
          validate: (response, count) => count === 5,
          status: (...args) => statusErrorPoll(...args)
        }
      },
      { pollInterval: 0 }
    );

    // Note: The status callback is an independent async func fired out of sequence, we wait for it to resolve.
    await new Promise(resolve => {
      setTimeout(() => resolve(), 100);
    });

    expect(statusErrorPoll).toHaveBeenCalledTimes(2);
    expect({
      status: statusErrorPoll.mock.calls.map(([response, count]) => ({
        response: {
          error: response?.error,
          data: response?.data,
          pollConfig: response?.config.poll
        },
        count
      }))
    }).toMatchSnapshot('different service call error with status callback');
  });

  it('should handle polling against a different service call path but with a callback error', async () => {
    const consoleSpyError = jest.spyOn(console, 'error');

    await serviceConfig.axiosServiceCall(
      {
        cache: false,
        url: '/test/',
        poll: {
          validate: (response, count) => count === 1,
          location: () => {
            throw new Error('location string error');
          }
        }
      },
      { pollInterval: 0 }
    );

    // Note: The location callback is an independent async func fired out of sequence, we wait for it to resolve.
    await new Promise(resolve => {
      setTimeout(() => resolve(), 100);
    });

    expect(consoleSpyError.mock.calls).toMatchSnapshot('different service call with callback errors');
    consoleSpyError.mockClear();
  });

  it('should handle polling against a different service call path error and status callback error', async () => {
    const consoleSpyError = jest.spyOn(console, 'error');

    const statusStatusErrorPoll = jest.fn();
    await serviceConfig.axiosServiceCall(
      {
        cache: false,
        url: '/test/',
        poll: {
          location: '/pollError',
          validate: (response, count) => count === 5,
          status: (...args) => {
            statusStatusErrorPoll(...args);
            throw new Error('status error');
          }
        }
      },
      { pollInterval: 0 }
    );

    // Note: The status callback is an independent async func fired out of sequence, we wait for it to resolve.
    await new Promise(resolve => {
      setTimeout(() => resolve(), 100);
    });

    expect(statusStatusErrorPoll).toHaveBeenCalledTimes(2);
    expect({
      status: statusStatusErrorPoll.mock.calls.map(([response, count]) => ({
        response: {
          error: response?.error,
          data: response?.data,
          pollConfig: response?.config.poll
        },
        count
      }))
    }).toMatchSnapshot('status of a status error polling');
    expect(consoleSpyError.mock.calls).toMatchSnapshot('status of a status error');
    consoleSpyError.mockClear();
  });
});

describe('Emulate a service call with a function', () => {
  it('should allow emulating a service call by passing a function', async () => {
    const output = 'lorem.ipsum';
    const response = await serviceConfig.axiosServiceCall({
      cache: true,
      url: () => output
    });

    expect(response.data).toBe(output);
  });

  it('should allow emulating a service call by passing a promise-like function', async () => {
    const output = 'lorem.ipsum';
    const response = await serviceConfig.axiosServiceCall({
      cache: true,
      url: async () => output
    });

    expect(response.data).toBe(output);
  });

  it('should allow schema transforming a function call response', async () => {
    const response = await serviceConfig.axiosServiceCall({
      cache: true,
      url: () => 'lorem.ipsum',
      schema: [successResponse => `${successResponse}-function-schema-transform`]
    });

    expect(response.data).toMatchSnapshot('transform');
  });

  it('should allow transforming a function call response', async () => {
    const response = await serviceConfig.axiosServiceCall({
      cache: true,
      url: () => Promise.resolve('lorem.ipsum'),
      transform: [successResponse => `${successResponse}-function-transform`]
    });

    expect(response.data).toMatchSnapshot('transform');
  });

  it('should handle function call response errors', async () => {
    const responses = await Promise.allSettled([
      serviceConfig.axiosServiceCall({
        url: () => Promise.reject(new Error('dolor.sit'))
      })
    ]);

    expect(responses.map(({ reason }) => reason.message)).toMatchSnapshot('error');
  });

  it('should handle function call response error with transformations', async () => {
    const responses = await Promise.allSettled([
      serviceConfig.axiosServiceCall({
        url: () => Promise.reject(new Error('dolor.sit')),
        transform: [
          successResponse => `${successResponse}-transform`,
          errorResponse => `${errorResponse}-error-transform`
        ]
      })
    ]);

    expect(responses.map(({ reason }) => reason.response.data)).toMatchSnapshot('error transformation');
  });

  it('should handle function call response error string with transformations', async () => {
    const responses = await Promise.allSettled([
      serviceConfig.axiosServiceCall({
        url: () => Promise.reject('dolor.sit'), // eslint-disable-line
        transform: [
          successResponse => `${successResponse}-transform`,
          errorResponse => `${errorResponse}-error-transform`
        ]
      })
    ]);

    expect(responses.map(({ reason }) => reason.response.data)).toMatchSnapshot('error transformation');
  });
});
