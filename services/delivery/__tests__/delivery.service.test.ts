import { DeliveryApiClient } from '../../clients/delivery-api.client';
import { DeliveryService } from '../delivery.service';

describe('DeliveryService', () => {
  const api = DeliveryApiClient.prototype as any;
  afterEach(() => jest.restoreAllMocks());

  it('session orders ask for every status and payment of one session, normalised', async () => {
    const spy = jest.spyOn(api, 'getAreaOrders').mockResolvedValue({ orders: [{ id: 'A', total_price: '10.00' }] });
    const list = await new DeliveryService().getSessionOrders({ area_id: 3, meal_time: 'lunch', target_date: '2026-10-27' });
    expect(spy).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', type: 'all', payment_status: 'any' });
    expect(list[0]).toMatchObject({ order_id: 'A', total_price: 10 });
  });

  it('unpaid orders cover every status and day of the area', async () => {
    const spy = jest.spyOn(api, 'getAreaOrders').mockResolvedValue({ orders: [] });
    await new DeliveryService().getUnpaidOrders(3);
    expect(spy).toHaveBeenCalledWith({ area_id: 3, type: 'all', payment_status: 'unpaid' });
  });

  it('marks delivered and failed (trimmed reason) through the status endpoint', async () => {
    const spy = jest.spyOn(api, 'updateOrderStatus').mockResolvedValue({});
    const s = new DeliveryService();
    await s.markDelivered('A');
    await s.markFailed('B', '  not at hostel ');
    expect(spy.mock.calls).toEqual([['A', 'delivered'], ['B', 'delivery_failed', 'not at hostel']]);
  });

  it('returns the summary and wraps API errors with the server message', async () => {
    jest.spyOn(api, 'getSummary').mockResolvedValue({ summary: { failed: { orders: 1 } } });
    await expect(new DeliveryService().getSummary({ area_id: 3, meal_time: 'lunch' })).resolves.toEqual({ failed: { orders: 1 } });
    jest.spyOn(api, 'startDelivery').mockRejectedValue({ response: { status: 409, data: { message: 'Ordering is still open for this session. Start delivery after it closes.' } } });
    await expect(new DeliveryService().startDelivery({ area_id: 3, meal_time: 'lunch' })).rejects.toMatchObject({ status: 409 });
  });
});
