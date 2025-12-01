'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { ChartConfig } from '@/components/ui/chart';
import { ChartComponentConfig } from '@/types/artifact';

interface ChartProps {
  config: ChartComponentConfig;
}

export default function Chart({ config }: ChartProps) {
  const { title, description, type, data, xAxisKey, yAxisKey, colors } = config;

  // Build chart config for shadcn/ui
  const chartConfig: ChartConfig = {};
  
  // For line/bar/area charts, create config for each data key
  if (type !== 'pie' && data.length > 0) {
    const firstItem = data[0];
    Object.keys(firstItem).forEach((key, index) => {
      if (key !== xAxisKey) {
        chartConfig[key] = {
          label: key.charAt(0).toUpperCase() + key.slice(1),
          color: colors?.[index] || `hsl(var(--chart-${(index % 5) + 1}))`,
        };
      }
    });
  }

  // For pie charts, create config for each slice
  if (type === 'pie') {
    data.forEach((item, index) => {
      const key = item[xAxisKey || 'name'];
      chartConfig[key] = {
        label: key,
        color: colors?.[index] || `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ChartContainer config={chartConfig}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey || 'name'} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {Object.keys(chartConfig).map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        );

      case 'bar':
        return (
          <ChartContainer config={chartConfig}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey || 'name'} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {Object.keys(chartConfig).map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        );

      case 'area':
        return (
          <ChartContainer config={chartConfig}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey || 'name'} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {Object.keys(chartConfig).map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  fill={`var(--color-${key})`}
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        );

      case 'pie':
        return (
          <ChartContainer config={chartConfig}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey={yAxisKey || 'value'}
                nameKey={xAxisKey || 'name'}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors?.[index] || `hsl(var(--chart-${(index % 5) + 1}))`}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        );

      default:
        return <div className="text-sm text-destructive">Unknown chart type: {type}</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">{renderChart()}</div>
      </CardContent>
    </Card>
  );
}

