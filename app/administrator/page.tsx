import { Avatar } from '@/components/administrator-ui/avatar';
import { Badge } from '@/components/administrator-ui/badge';
import { Divider } from '@/components/administrator-ui/divider';
import { Heading, Subheading } from '@/components/administrator-ui/heading';
import { Select } from '@/components/administrator-ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/administrator-ui/table';
import { getRecentOrders } from './data';

// Define the types
interface Event {
  id: number;
  name: string;
  url: string;
  date: string;
  time: string;
  location: string;
  totalRevenue: string;
  totalRevenueChange: string;
  ticketsAvailable: number;
  ticketsSold: number;
  ticketsSoldChange: string;
  pageViews: string;
  pageViewsChange: string;
  status: string;
  imgUrl: string;
  thumbUrl: string;
}

interface Order {
  id: number;
  url: string;
  date: string;
  amount: {
    usd: string;
    cad: string;
    fee: string;
    net: string;
  };
  payment: {
    transactionId: string;
    card: {
      number: string;
      type: string;
      expiry: string;
    };
  };
  customer: {
    name: string;
    email: string;
    address: string;
    country: string;
    countryFlagUrl: string;
  };
  event: Event;
}

export function Stat({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div>
      <Divider />
      <div className="mt-6 text-lg/6 font-medium sm:text-sm/6">{title}</div>
      <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">{value}</div>
      <div className="mt-3 text-sm/6 sm:text-xs/6">
        <Badge color={change.startsWith('+') ? 'lime' : 'pink'}>{change}</Badge>{' '}
        <span className="text-zinc-500">from last week</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const orders: Order[] = await getRecentOrders(); // Type the orders correctly

  return (
    <>
      <Heading>Good afternoon, Erica</Heading>
      <div className="mt-8 flex items-end justify-between">
        <Subheading>Overview</Subheading>
        <div>
          <Select name="period">
            <option value="last_week">Last week</option>
            <option value="last_two">Last two weeks</option>
            <option value="last_month">Last month</option>
            <option value="last_quarter">Last quarter</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total revenue" value="$2.6M" change="+4.5%" />
        <Stat title="Average order value" value="$455" change="-0.5%" />
        <Stat title="Tickets sold" value="5,888" change="+4.5%" />
        <Stat title="Pageviews" value="823,067" change="+21.2%" />
      </div>
      <Subheading className="mt-14">Recent orders</Subheading>
      <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Order number</TableHeader>
            <TableHeader>Purchase date</TableHeader>
            <TableHeader>Customer</TableHeader>
            <TableHeader>Event</TableHeader>
            <TableHeader className="text-right">Amount</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
              <TableCell>{order.id}</TableCell>
              <TableCell className="text-zinc-500">{order.date}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar src={order.event.thumbUrl} className="size-6" />
                  <span>{order.event.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{order.amount.usd}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
