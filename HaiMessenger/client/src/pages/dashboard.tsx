import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Thermometer, Microchip, Lightbulb, Trash2, Wifi, WifiOff } from "lucide-react";
import { SensorReading } from "@shared/schema";

interface WebSocketMessage {
  type: 'sensor_data' | 'connection_status';
  data?: SensorReading;
  status?: string;
}

export default function Dashboard() {
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial data
  const { data: recentReadings } = useQuery({
    queryKey: ['/api/readings/recent'],
    refetchInterval: false,
  });

  const { data: latestReading } = useQuery({
    queryKey: ['/api/readings/latest'],
    refetchInterval: false,
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'sensor_data' && message.data) {
          setSensorData(message.data);
          setLastUpdate(new Date());
          
          // Add to historical data
          setHistoricalData(prev => {
            const newData = [message.data!, ...prev];
            return newData.slice(0, 20); // Keep last 20 readings
          });
        }
        
        if (message.type === 'connection_status') {
          setConnectionStatus(message.status === 'connected' ? 'connected' : 'disconnected');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      setConnectionStatus('disconnected');
    };

    ws.onerror = () => {
      setWsConnected(false);
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Initialize with existing data
  useEffect(() => {
    if (recentReadings) {
      setHistoricalData(recentReadings);
    }
  }, [recentReadings]);

  useEffect(() => {
    if (latestReading) {
      setSensorData(latestReading);
    }
  }, [latestReading]);

  const getTemperatureStatus = (temp: number | null) => {
    if (!temp) return <Badge variant="secondary">No data</Badge>;
    
    if (temp > 30) {
      return <Badge className="bg-red-900 text-red-200">High</Badge>;
    } else if (temp >= 25) {
      return <Badge className="bg-orange-900 text-orange-200">Warm</Badge>;
    } else if (temp >= 20) {
      return <Badge className="bg-yellow-900 text-yellow-200">Normal</Badge>;
    } else {
      return <Badge className="bg-blue-900 text-blue-200">Cool</Badge>;
    }
  };

  const getLEDDescription = (level: number) => {
    const descriptions = [
      'All LEDs off (< 20°C)',
      '1 LED active (20-24°C)',
      '2 LEDs active (25-29°C)',
      '3 LEDs active (≥ 30°C)'
    ];
    return descriptions[level] || 'Unknown state';
  };

  const clearHistory = useCallback(() => {
    setHistoricalData([]);
  }, []);

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatChartData = () => {
    return historicalData.slice(0, 10).reverse().map((reading, index) => ({
      time: formatTime(reading.timestamp),
      DHT11: reading.dhtTemperature,
      LM35: reading.lm35Temperature
    }));
  };

  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
      case 'connecting':
        return <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>;
      case 'disconnected':
        return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-surface border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Thermometer className="text-primary text-2xl mr-3" />
            <h1 className="text-xl font-medium text-white">IoT Temperature Monitor</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getConnectionIndicator()}
              <span className="text-sm">{getConnectionText()}</span>
            </div>
            <div className="text-sm text-gray-400">
              {lastUpdate ? `Last update: ${formatTime(lastUpdate)}` : 'Last update: Never'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* DHT11 Temperature Card */}
          <Card className="bg-surface border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white">DHT11 Sensor</CardTitle>
              <Microchip className="text-primary text-xl" />
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-light text-white mb-2">
                  {sensorData?.dhtTemperature ? sensorData.dhtTemperature.toFixed(1) : '--'}
                </div>
                <div className="text-gray-400 mb-3">°C</div>
                <div className="mt-3">
                  {getTemperatureStatus(sensorData?.dhtTemperature || null)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LM35 Temperature Card */}
          <Card className="bg-surface border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white">LM35 Sensor</CardTitle>
              <Thermometer className="text-primary text-xl" />
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-light text-white mb-2">
                  {sensorData?.lm35Temperature ? sensorData.lm35Temperature.toFixed(1) : '--'}
                </div>
                <div className="text-gray-400 mb-3">°C</div>
                <div className="mt-3">
                  {getTemperatureStatus(sensorData?.lm35Temperature || null)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LED Status Card */}
          <Card className="bg-surface border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white">LED Status</CardTitle>
              <Lightbulb className="text-primary text-xl" />
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-light text-white mb-2">
                  {sensorData?.ledLevel || 0}
                </div>
                <div className="text-gray-400 mb-4">Active LEDs</div>
                <div className="flex justify-center items-center space-x-2 mb-2">
                  {[1, 2, 3].map((ledNum) => (
                    <div
                      key={ledNum}
                      className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                        (sensorData?.ledLevel || 0) >= ledNum
                          ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/50'
                          : 'bg-gray-800 border-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-400">
                  {getLEDDescription(sensorData?.ledLevel || 0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart and Historical Data Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Temperature Trend Chart */}
          <Card className="xl:col-span-2 bg-surface border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white">Temperature Trend</CardTitle>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span className="text-gray-400">DHT11</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                  <span className="text-gray-400">LM35</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#E5E5E5' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E1E1E', 
                        border: '1px solid #424242',
                        borderRadius: '8px',
                        color: '#E5E5E5'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="DHT11" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="LM35" 
                      stroke="#F97316" 
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Historical Data Table */}
          <Card className="bg-surface border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white">Recent Readings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-primary hover:text-blue-400"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {historicalData.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-8">
                    No data available
                  </div>
                ) : (
                  historicalData.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <div className="text-xs text-gray-400">
                        {formatTime(entry.timestamp)}
                      </div>
                      <div className="flex space-x-3 text-xs">
                        <span className="text-blue-400">
                          {entry.dhtTemperature ? entry.dhtTemperature.toFixed(1) : 'ERR'}°C
                        </span>
                        <span className="text-orange-400">
                          {entry.lm35Temperature ? entry.lm35Temperature.toFixed(1) : 'ERR'}°C
                        </span>
                        <span className="text-green-400">L{entry.ledLevel}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Information Panel */}
        <Card className="mt-6 bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">MQTT Server</div>
                <div className="text-white">mqtt.revolusi-it.com</div>
              </div>
              <div>
                <div className="text-gray-400">Client ID</div>
                <div className="text-white">G.231.22.0062</div>
              </div>
              <div>
                <div className="text-gray-400">Topic</div>
                <div className="text-white">iot/G.231.22.0062</div>
              </div>
              <div>
                <div className="text-gray-400">Connection Status</div>
                <div className="text-white">
                  {wsConnected ? 'Connected and receiving data' : 'Disconnected'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
