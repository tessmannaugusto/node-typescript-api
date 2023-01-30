import { StormGlass } from '@src/clients/stormGlass';
import * as HTTPUtil from '@src/util/request';
import stormGlassWeather3HoursFixture from '@test/fixtures/stormglass_weather_3_hours.json';
import stormGlassNormalizedResponseWeather3HoursFixture from '@test/fixtures/stormGlass_normalized_response_weather_3_hours.json';

jest.mock('@src/util/request');

describe('StormGlass client', () => {
  const MockedRequestClass = HTTPUtil.Request as jest.Mocked<
    typeof HTTPUtil.Request
  >;
  const mockedRequest = new HTTPUtil.Request() as jest.Mocked<HTTPUtil.Request>;
  it('should return the normalized forecast from the stormGlass service', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedRequest.get.mockResolvedValue({
      data: stormGlassWeather3HoursFixture,
    } as HTTPUtil.Response);

    const stormGlass = new StormGlass(mockedRequest);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual(stormGlassNormalizedResponseWeather3HoursFixture);
  });
  it('should exclude response when returns with incomplete datapoints', async () => {
    const lat = -33.792726;
    const lng = 151.289824;
    const incompleteResponse = {
      hours: [
        {
          windDirection: {
            noaa: 300,
          },
          time: '2020-04-26T00:00:00+00:00',
        },
      ],
    };
    mockedRequest.get.mockResolvedValueOnce({
      data: incompleteResponse,
    } as HTTPUtil.Response);

    const stormGlass = new StormGlass(mockedRequest);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual([]);
  });
  it('should get a generic error from stormglass service when the request fails before reaching the service', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedRequest.get.mockRejectedValueOnce({ message: 'Network Error' });

    const stormGlass = new StormGlass(mockedRequest);

    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying to communicate to StormGlass: Network Error'
    );
  });
  it('should get an StormGlassResponseError when the StormGlass service responds with error', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    MockedRequestClass.isRequestError.mockReturnValue(true);
    mockedRequest.get.mockRejectedValueOnce({
      response: {
        status: 429,
        data: { errors: ['Rate limit reached'] },
      },
    });

    const stormGlass = new StormGlass(mockedRequest);

    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error returned by the StormGlass service: Error: {"errors":["Rate limit reached"]} Code: 429'
    );
  });
});
