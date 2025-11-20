import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config.js';
import { ref, onValue, get } from 'firebase/database';
import './AdminDashboard.css';

const AdminDashboard = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [consumers, setConsumers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real Firebase data
    fetchRealFirebaseData();
  }, []);

  const fetchRealFirebaseData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting Firebase data fetch...');
      
      // Fetch all users from Firebase
      const usersRef = ref(db, 'Logging/users');
      const usersSnapshot = await get(usersRef);
      console.log('📊 Firebase snapshot exists:', usersSnapshot.exists());
      
      // Get root Logging sensor data (shared by all users)
      const rootLoggingRef = ref(db, 'Logging');
      const rootSnapshot = await get(rootLoggingRef);
      const rootSensorData = rootSnapshot.exists() ? rootSnapshot.val() : {};
      console.log('🔍 Root Logging sensor data:', rootSensorData);
      
      if (usersSnapshot.exists()) {
        const usersData = usersSnapshot.val();
        const consumersList = [];
        const alertsList = [];
        
        // Process each user
        Object.keys(usersData).forEach(userId => {
          const userData = usersData[userId];
          const profile = userData.profile || {};
          const customerId = userData.customerId || 'N/A';
          
          // Use root sensor data (same for all users) with correct field names
          const current = parseFloat(rootSensorData.Current || 0);
          const voltage = parseFloat(rootSensorData.Voltage || 220);
          const sharedSensorData = {
            current: current.toFixed(2),
            power: (current * voltage).toFixed(2), // Calculate power from current and voltage
            voltage: voltage.toFixed(2),
            gas: rootSensorData.Gas,
            flame: rootSensorData.Flame,
            smoke: rootSensorData.Smoke
          };
          
          // Debug: Log user structure for troubleshooting
          console.log(`👤 User ${profile.name || 'Unknown'}:`, {
            userId,
            customerId,
            sharedSensorData
          });
          
          if (sharedSensorData.gas === 1 || sharedSensorData.gas === "1" || 
              sharedSensorData.flame === 1 || sharedSensorData.flame === "1" || 
              sharedSensorData.smoke === 1 || sharedSensorData.smoke === "1") {
            console.log(`⚠️  ALERT TRIGGERED for ${profile.name}:`, {
              Gas: sharedSensorData.gas,
              Flame: sharedSensorData.flame, 
              Smoke: sharedSensorData.smoke
            });
          }
          
          // Create consumer object with shared sensor data
          const consumer = {
            id: customerId,
            uid: userId,
            name: profile.name || 'Unknown User',
            email: profile.email || 'No email',
            address: profile.address || 'No address provided',
            currentUsage: sharedSensorData.current,
            powerUsage: sharedSensorData.power,
            voltage: sharedSensorData.voltage,
            balance: profile.balance || '0.00',
            status: determineUserStatus(userData),
            lastSeen: userData.meta?.lastLogin ? new Date(userData.meta.lastLogin).toLocaleString() : 'Never',
            gasAlert: sharedSensorData.gas === 1 || sharedSensorData.gas === "1",
            flameAlert: sharedSensorData.flame === 1 || sharedSensorData.flame === "1",
            smokeAlert: sharedSensorData.smoke === 1 || sharedSensorData.smoke === "1",
            theftAlert: false, // Will be updated from BESCOM/Theft/value
            tamperingAlert: false, // Can be enhanced with tampering detection
            location: profile.location || { lat: 12.9716, lng: 77.5946 },
            rechargeHistory: userData.transactions || []
          };
          
          consumersList.push(consumer);
          
          // Generate alerts based on shared sensor data (handle both string and number values)
          if (sharedSensorData.gas === 1 || sharedSensorData.gas === "1") {
            alertsList.push(createAlert(consumer, 'gas', 'Gas leak detected', 'critical'));
          }
          if (sharedSensorData.flame === 1 || sharedSensorData.flame === "1") {
            alertsList.push(createAlert(consumer, 'flame', 'Fire hazard detected', 'critical'));
          }
          if (sharedSensorData.smoke === 1 || sharedSensorData.smoke === "1") {
            alertsList.push(createAlert(consumer, 'smoke', 'Smoke detected', 'critical'));
          }
          if (parseFloat(consumer.balance) < 50) {
            alertsList.push(createAlert(consumer, 'low-balance', `Low balance: ₹${consumer.balance}`, 'warning'));
          }
        });
        
        setConsumers(consumersList);
        
        // Check for system-wide theft detection from root Logging data
        if (rootSnapshot.exists()) {
          const rootSensorData = rootSnapshot.val();
          console.log('🚨 Checking for theft detection:', rootSensorData.Theft);
          // Check for theft detection - handle both direct value and nested object
          const theftValue = typeof rootSensorData.Theft === 'object' ? rootSensorData.Theft?.value : rootSensorData.Theft;
          console.log('🔍 Theft value:', theftValue);
          if (theftValue === "1" || theftValue === 1) {
            console.log('🚨 THEFT DETECTED! Creating theft alert...');
            alertsList.push({
              id: Math.random().toString(36).substr(2, 9),
              consumerId: 'SYSTEM',
              consumerName: 'System Wide Alert',
              type: 'theft',
              message: 'Theft detected - System Wide',
              severity: 'critical',
              timestamp: new Date().toLocaleString(),
              location: { lat: 12.9716, lng: 77.5946 },
              acknowledged: false
            });
          }
        }
        
        setAlerts(alertsList);
        
        // Debug: Log alert generation
        console.log('Generated alerts:', alertsList.length);
        console.log('Critical alerts:', alertsList.filter(a => a.severity === 'critical').length);
        
        // Calculate system statistics
        const isRelayOn = rootSensorData.Relay === "1" || rootSensorData.Relay === 1;
        const stats = {
          totalConsumers: consumersList.length,
          onlineConsumers: consumersList.filter(c => c.status === 'online').length,
          totalAlerts: alertsList.length,
          criticalAlerts: alertsList.filter(a => a.severity === 'critical').length,
          // Show power usage only when relay is ON
          totalPowerUsage: isRelayOn ? 
            consumersList.reduce((sum, c) => sum + parseFloat(c.powerUsage || 0), 0).toFixed(2) : 
            '-- (Relay OFF)',
          // Use balance from root BESCOM data instead of individual user balances
          averageBalance: parseFloat(rootSensorData.Balance || 0).toFixed(2),
          systemUptime: '99.8%',
          lastUpdate: new Date().toLocaleString(),
          relayStatus: isRelayOn ? 'ON' : 'OFF'
        };
        
        setSystemStats(stats);
      } else {
        console.log('No users data found');
        setConsumers([]);
        setAlerts([]);
        setSystemStats({
          totalConsumers: 0,
          onlineConsumers: 0,
          totalAlerts: 0,
          criticalAlerts: 0,
          totalPowerUsage: '0.00',
          averageBalance: '0.00',
          systemUptime: '99.8%',
          lastUpdate: new Date().toLocaleString()
        });
      }
    } catch (error) {
      console.error('Error fetching Firebase data:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineUserStatus = (userData) => {
    const lastLogin = userData.meta?.lastLogin;
    if (!lastLogin) return 'offline';
    
    const now = new Date().getTime();
    const lastLoginTime = new Date(lastLogin).getTime();
    const timeDiff = now - lastLoginTime;
    
    // Consider user online if logged in within last 30 minutes
    return timeDiff < (30 * 60 * 1000) ? 'online' : 'offline';
  };

  const createAlert = (consumer, type, message, severity) => ({
    id: Math.random().toString(36).substr(2, 9),
    consumerId: consumer.id,
    consumerName: consumer.name,
    type,
    message,
    severity,
    timestamp: new Date().toLocaleString(),
    location: consumer.location,
    acknowledged: false
  });

  // Set up real-time listener for root Logging sensor data (like user dashboard)
  useEffect(() => {
    const rootSensorRef = ref(db, 'Logging');
    let previousTheftStatus = null;
    
    const unsubscribe = onValue(rootSensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const rootSensorData = snapshot.val();
        console.log('🔄 Real-time root sensor data update:', rootSensorData);
        
        // Check for theft detection and show alert
        const theftValue = typeof rootSensorData.Theft === 'object' ? rootSensorData.Theft?.value : rootSensorData.Theft;
        if ((theftValue === "1" || theftValue === 1) && previousTheftStatus !== "1" && previousTheftStatus !== 1) {
          alert('⚠️ CRITICAL ALERT: Theft Detected in the System!');
        }
        previousTheftStatus = theftValue;
        
        // Update alerts based on root sensor data
        setAlerts(prev => {
          // Remove old system alerts
          const nonSystemAlerts = prev.filter(alert => alert.consumerId !== 'SYSTEM');
          const newSystemAlerts = [];
          
          if (rootSensorData.Gas === "1") {
            newSystemAlerts.push({
              id: Math.random().toString(36).substr(2, 9),
              consumerId: 'SYSTEM',
              consumerName: 'System Wide Alert',
              type: 'gas',
              message: 'Gas leak detected - System Wide',
              severity: 'critical',
              timestamp: new Date().toLocaleString(),
              location: { lat: 12.9716, lng: 77.5946 },
              acknowledged: false
            });
          }
          if (rootSensorData.Flame === "1") {
            newSystemAlerts.push({
              id: Math.random().toString(36).substr(2, 9),
              consumerId: 'SYSTEM',
              consumerName: 'System Wide Alert',
              type: 'flame',
              message: 'Fire hazard detected - System Wide',
              severity: 'critical',
              timestamp: new Date().toLocaleString(),
              location: { lat: 12.9716, lng: 77.5946 },
              acknowledged: false
            });
          }
          if (rootSensorData.Smoke === "1") {
            newSystemAlerts.push({
              id: Math.random().toString(36).substr(2, 9),
              consumerId: 'SYSTEM',
              consumerName: 'System Wide Alert',
              type: 'smoke',
              message: 'Smoke detected - System Wide',
              severity: 'critical',
              timestamp: new Date().toLocaleString(),
              location: { lat: 12.9716, lng: 77.5946 },
              acknowledged: false
            });
          }
          // Check for theft detection - handle both direct value and nested object
          const theftValue = typeof rootSensorData.Theft === 'object' ? rootSensorData.Theft?.value : rootSensorData.Theft;
          console.log('🔄 Real-time theft check:', theftValue);
          if (theftValue === "1" || theftValue === 1) {
            console.log('🚨 REAL-TIME THEFT DETECTED! Creating theft alert...');
            newSystemAlerts.push({
              id: Math.random().toString(36).substr(2, 9),
              consumerId: 'SYSTEM',
              consumerName: 'System Wide Alert',
              type: 'theft',
              message: 'Theft detected - System Wide',
              severity: 'critical',
              timestamp: new Date().toLocaleString(),
              location: { lat: 12.9716, lng: 77.5946 },
              acknowledged: false
            });
          }
          
          return [...nonSystemAlerts, ...newSystemAlerts];
        });
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Set up real-time listeners for shared sensor data updates (affects all consumers)
  useEffect(() => {
    if (consumers.length === 0) return;

    // Single listener for root Logging sensor data (shared by all users)
    const sensorRef = ref(db, 'Logging');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const rootSensorData = snapshot.val();
        
        // Update all consumers with the same shared sensor data
        const current = parseFloat(rootSensorData.Current || 0);
        const voltage = parseFloat(rootSensorData.Voltage || 220);
        const sharedData = {
          currentUsage: current.toFixed(2),
          powerUsage: (current * voltage).toFixed(2), // Calculate power from current and voltage
          voltage: voltage.toFixed(2),
          gasAlert: rootSensorData.Gas === 1 || rootSensorData.Gas === "1",
          flameAlert: rootSensorData.Flame === 1 || rootSensorData.Flame === "1",
          smokeAlert: rootSensorData.Smoke === 1 || rootSensorData.Smoke === "1",
        };
        
        setConsumers(prev => prev.map(c => ({
          ...c,
          ...sharedData
        })));
        
        // Update system statistics when power usage changes
        const isRelayOn = rootSensorData.Relay === "1" || rootSensorData.Relay === 1;
        setSystemStats(prev => ({
          ...prev,
          totalPowerUsage: isRelayOn ? 
            (consumers.length * parseFloat(sharedData.powerUsage)).toFixed(2) : 
            '-- (Relay OFF)',
          averageBalance: parseFloat(rootSensorData.Balance || 0).toFixed(2), // Use balance from root Logging data
          relayStatus: isRelayOn ? 'ON' : 'OFF',
          lastUpdate: new Date().toLocaleString()
        }));
        
        // Update alerts in real-time based on shared sensor changes
        setAlerts(prevAlerts => {
          // Remove old sensor-based alerts
          const otherAlerts = prevAlerts.filter(alert => 
            !['gas', 'flame', 'smoke'].includes(alert.type)
          );
          
          // Add new alerts for all consumers if sensors are triggered
          const newAlerts = [];
          if (rootSensorData.Gas === 1 || rootSensorData.Gas === "1") {
            consumers.forEach(consumer => {
              newAlerts.push(createAlert(consumer, 'gas', 'Gas leak detected', 'critical'));
            });
          }
          if (rootSensorData.Flame === 1 || rootSensorData.Flame === "1") {
            consumers.forEach(consumer => {
              newAlerts.push(createAlert(consumer, 'flame', 'Fire hazard detected', 'critical'));
            });
          }
          if (rootSensorData.Smoke === 1 || rootSensorData.Smoke === "1") {
            consumers.forEach(consumer => {
              newAlerts.push(createAlert(consumer, 'smoke', 'Smoke detected', 'critical'));
            });
          }
          
          return [...otherAlerts, ...newAlerts];
        });
      }
    });

    return () => unsubscribe();
  }, [consumers.length]);

  // Update system statistics when alerts change
  useEffect(() => {
    if (alerts.length >= 0) {
      setSystemStats(prev => ({
        ...prev,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        lastUpdate: new Date().toLocaleString()
      }));
    }
  }, [alerts]);

  const handleDisconnectConsumer = (consumerId) => {
    setConsumers(prev => prev.map(consumer =>
      consumer.id === consumerId 
        ? { ...consumer, status: 'disconnected', lastSeen: new Date().toLocaleString() }
        : consumer
    ));
  };

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Test function to simulate critical alerts (for development/testing)
  const simulateCriticalAlert = () => {
    if (consumers.length > 0) {
      const testConsumer = consumers[0];
      const testAlerts = [
        createAlert(testConsumer, 'gas', 'Gas leak detected', 'critical'),
        createAlert(testConsumer, 'flame', 'Fire hazard detected', 'critical'),
        createAlert(testConsumer, 'smoke', 'Smoke detected', 'critical'),
        createAlert(testConsumer, 'theft', 'Theft detected', 'critical')
      ];
      setAlerts(prev => [...prev, ...testAlerts]);
    }
  };

  // Manual refresh function to re-fetch Firebase data
  const refreshData = () => {
    console.log('🔄 Manually refreshing Firebase data...');
    fetchRealFirebaseData();
  };

  const exportConsumerData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Email,Address,Current(A),Power(W),Voltage(V),Balance,Status,Last Seen\n"
      + consumers.map(c => 
          `${c.id},${c.name},${c.email},"${c.address}",${c.currentUsage},${c.powerUsage},${c.voltage},${c.balance},${c.status},${c.lastSeen}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bescom_consumers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredConsumers = consumers.filter(consumer =>
    consumer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consumer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consumer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverview = () => (
    <div className="admin-overview">
      {loading ? (
        <div className="admin-card">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading consumer data from Firebase...</p>
          </div>
        </div>
      ) : (
        <>
          {/* System Statistics Card */}
          <section className="admin-card">
            <h3 style={{ marginTop: 0, color: '#1a365d', marginBottom: '1.5rem' }}>
              System Statistics
            </h3>
            <div className="admin-grid admin-grid-4">
              <div className="admin-kpi-item">
                <div className="admin-kpi-label">Total Consumers</div>
                <div className="admin-kpi-value">{systemStats.totalConsumers || 0}</div>
              </div>
              <div className="admin-kpi-item">
                <div className="admin-kpi-label">Online Consumers</div>
                <div className="admin-kpi-value" style={{color: '#10b981'}}>{systemStats.onlineConsumers || 0}</div>
              </div>
              <div className="admin-kpi-item">
                <div className="admin-kpi-label">Active Alerts</div>
                <div className="admin-kpi-value" style={{color: '#f59e0b'}}>{systemStats.totalAlerts || 0}</div>
              </div>
              <div className="admin-kpi-item">
                <div className="admin-kpi-label">Critical Alerts</div>
                <div className="admin-kpi-value" style={{color: '#ef4444'}}>{systemStats.criticalAlerts || 0}</div>
              </div>
            </div>
          </section>

          {/* Power Usage Card */}
          <section className="admin-card">
            <h3 style={{ marginTop: 0, color: '#1a365d', marginBottom: '1.5rem' }}>
              Power Usage Overview
              {systemStats.relayStatus && (
                <span style={{
                  fontSize: '0.8rem',
                  marginLeft: '1rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: systemStats.relayStatus === 'ON' ? '#10b981' : '#ef4444',
                  color: 'white',
                  fontWeight: '500'
                }}>
                  {systemStats.relayStatus === 'ON' ? '🟢 Relay ON' : '🔴 Relay OFF'}
                </span>
              )}
            </h3>
            <div className="admin-grid admin-grid-2">
              <div className="admin-kpi-item">
                <div className="admin-kpi-label">Total Power Usage</div>
                <div className="admin-kpi-value" style={{
                  color: systemStats.relayStatus === 'OFF' ? '#6b7280' : '#8b5cf6'
                }}>
                  {typeof systemStats.totalPowerUsage === 'string' && systemStats.totalPowerUsage.includes('Relay OFF') 
                    ? systemStats.totalPowerUsage 
                    : `${systemStats.totalPowerUsage || '0.00'} W`}
                </div>
              </div>
              <div className="admin-kpi-item">
                <div className="admin-kpi-label">System Balance</div>
                <div className="admin-kpi-value" style={{color: '#06b6d4'}}>₹{systemStats.averageBalance || '0.00'}</div>
              </div>
            </div>
          </section>

          {/* Recent Critical Alerts Card */}
          <section className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#1a365d' }}>
                Recent Critical Alerts ({alerts.filter(alert => alert.severity === 'critical').length})
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="copy-btn"
                  onClick={refreshData}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#10b981' }}
                >
                  🔄 Refresh Data
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button 
                    className="copy-btn"
                    onClick={simulateCriticalAlert}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    🧪 Test Alerts
                  </button>
                )}
              </div>
            </div>
            
            {alerts.filter(alert => alert.severity === 'critical').length === 0 ? (
              <div className="admin-field" style={{ textAlign: 'center', color: '#6b7280' }}>
                No critical alerts currently. Critical alerts will appear when theft is detected (Logging/Theft/value = 1).
              </div>
            ) : (
              <div className="admin-grid">
                {alerts.filter(alert => alert.severity === 'critical').slice(0, 3).map(alert => (
                  <div key={alert.id} className="admin-field" style={{borderLeft: '4px solid #ef4444'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                      <span style={{color: '#ef4444', fontWeight: 600, fontSize: '0.8rem'}}>
                        {alert.type.toUpperCase()}
                      </span>
                      <span style={{color: '#6b7280', fontSize: '0.8rem'}}>{alert.timestamp}</span>
                    </div>
                    <div style={{fontWeight: 500, marginBottom: '0.25rem'}}>{alert.message}</div>
                    <div style={{color: '#6b7280', fontSize: '0.9rem'}}>
                      Consumer: {alert.consumerName} ({alert.consumerId})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );

  const renderConsumers = () => (
    <div className="consumers-section">
      {/* Search and Export Card */}
      <section className="admin-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
          <input
            type="text"
            placeholder="Search consumers by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-field"
            style={{flex: 1, minWidth: '300px', fontFamily: 'inherit'}}
          />
          <button 
            className="copy-btn" 
            onClick={exportConsumerData}
            style={{whiteSpace: 'nowrap'}}
          >
            📊 Export CSV
          </button>
        </div>
      </section>

      {/* Consumers List Card */}
      <section className="admin-card">
        <h3 style={{ marginTop: 0, color: '#1a365d', marginBottom: '1.5rem' }}>
          Registered Consumers ({filteredConsumers.length})
        </h3>
        
        <div className="admin-grid">
          {filteredConsumers.map(consumer => (
            <div key={consumer.id} className="admin-field" style={{position: 'relative'}}>
              {/* Status indicator */}
              <div style={{
                position: 'absolute', 
                top: '0.75rem', 
                right: '0.75rem',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: consumer.status === 'online' ? '#10b981' : '#6b7280'
              }}></div>
              
              <div className="admin-grid admin-grid-2" style={{gap: '0.75rem'}}>
                <div>
                  <div className="admin-label">Consumer ID</div>
                  <div style={{fontWeight: 600, color: '#3b82f6'}}>{consumer.id}</div>
                </div>
                <div>
                  <div className="admin-label">Name</div>
                  <div style={{fontWeight: 500}}>{consumer.name}</div>
                </div>
                <div>
                  <div className="admin-label">Current (A)</div>
                  <div style={{color: systemStats.relayStatus === 'OFF' ? '#6b7280' : 'inherit'}}>
                    {systemStats.relayStatus === 'OFF' ? '--' : consumer.currentUsage}
                  </div>
                </div>
                <div>
                  <div className="admin-label">Power (W)</div>
                  <div style={{color: systemStats.relayStatus === 'OFF' ? '#6b7280' : 'inherit'}}>
                    {systemStats.relayStatus === 'OFF' ? '--' : consumer.powerUsage}
                  </div>
                </div>
                <div>
                  <div className="admin-label">Voltage (V)</div>
                  <div style={{color: systemStats.relayStatus === 'OFF' ? '#6b7280' : 'inherit'}}>
                    {systemStats.relayStatus === 'OFF' ? '--' : consumer.voltage}
                  </div>
                </div>
                <div>
                  <div className="admin-label">Balance</div>
                  <div style={{
                    color: parseFloat(consumer.balance) < 100 ? '#f59e0b' : '#10b981',
                    fontWeight: 600
                  }}>
                    ₹{consumer.balance}
                  </div>
                </div>
              </div>
              
              <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <button 
                  className="copy-btn"
                  onClick={() => setSelectedConsumer(consumer)}
                  style={{fontSize: '0.8rem', padding: '0.4rem 0.8rem'}}
                >
                  👁️ View Details
                </button>
                {consumer.status !== 'disconnected' && (
                  <button 
                    className="copy-btn"
                    onClick={() => handleDisconnectConsumer(consumer.id)}
                    style={{
                      fontSize: '0.8rem', 
                      padding: '0.4rem 0.8rem',
                      background: '#ef4444',
                      borderColor: '#dc2626'
                    }}
                  >
                    🔌 Disconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-section">
      <div className="alerts-filter">
        <div className="filter-buttons">
          <button className="filter-btn all active">All Alerts ({alerts.length})</button>
          <button className="filter-btn critical">
            Critical ({alerts.filter(a => a.severity === 'critical').length})
          </button>
          <button className="filter-btn warning">
            Warning ({alerts.filter(a => a.severity === 'warning').length})
          </button>
        </div>
      </div>

      <div className="alerts-grid">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert-card ${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}`}>
            <div className="alert-header">
              <div className="alert-type-badge">{alert.type.replace('-', ' ').toUpperCase()}</div>
              <div className="alert-time">{alert.timestamp}</div>
            </div>
            
            <div className="alert-body">
              <div className="alert-message">{alert.message}</div>
              <div className="alert-consumer-info">
                <div>Consumer: {alert.consumerName}</div>
                <div>ID: {alert.consumerId}</div>
              </div>
            </div>
            
            <div className="alert-actions">
              <button 
                className={`acknowledge-btn ${alert.acknowledged ? 'acknowledged' : ''}`}
                onClick={() => acknowledgeAlert(alert.id)}
                disabled={alert.acknowledged}
              >
                {alert.acknowledged ? '✓ Acknowledged' : 'Acknowledge'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>System Performance</h4>
          <div className="performance-metrics">
            <div className="metric">
              <span className="metric-label">System Uptime:</span>
              <span className="metric-value">{systemStats.systemUptime}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Last Update:</span>
              <span className="metric-value">{systemStats.lastUpdate}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Response Time:</span>
              <span className="metric-value">45ms</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Demand Forecasting</h4>
          <div className="forecast-data">
            <div className="forecast-item">
              <span>Peak Hour Demand:</span>
              <span>18:00 - 21:00</span>
            </div>
            <div className="forecast-item">
              <span>Expected Load:</span>
              <span>+15% from last month</span>
            </div>
            <div className="forecast-item">
              <span>Grid Capacity:</span>
              <span>78% utilized</span>
            </div>
          </div>
        </div>

        <div className="analytics-card full-width">
          <h4>Regional Distribution</h4>
          <div className="region-stats">
            <div className="region">
              <span className="region-name">Bangalore North</span>
              <div className="region-bar">
                <div className="region-fill" style={{width: '85%'}}></div>
              </div>
              <span className="region-count">850 consumers</span>
            </div>
            <div className="region">
              <span className="region-name">Bangalore South</span>
              <div className="region-bar">
                <div className="region-fill" style={{width: '92%'}}></div>
              </div>
              <span className="region-count">920 consumers</span>
            </div>
            <div className="region">
              <span className="region-name">Bangalore East</span>
              <div className="region-bar">
                <div className="region-fill" style={{width: '78%'}}></div>
              </div>
              <span className="region-count">780 consumers</span>
            </div>
            <div className="region">
              <span className="region-name">Bangalore West</span>
              <div className="region-bar">
                <div className="region-fill" style={{width: '68%'}}></div>
              </div>
              <span className="region-count">680 consumers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-nav">
          <div className="admin-logo">
            <img 
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAABYlBMVEX////Szevo5vS9uOGZmb80M1L///1mZY329ftKSXHSzuro5fWVlbrKxeWVlbjGweKenryspsnU0ea9t+Ln5++Tkbuwq8o0NFEpKE2lpq8pKEmYl6UmJEYfHUMZFzvV19vNzc8nKD1BQWTx8fM6OlsQDjcgITgbGipzcpr39f//wgCWlq1SU28ZGUKvrrtKSWEAAAAqKkURECj03+xsaoF9e5LlKgDa2ezSlJiuAADUIQ5cW4bPzdlmZZHb1/YAABfoqbFhX4G9vcylEwgAACiFhaFXVnw2NV1kYoEAAD2AfJ90c5K1s8mlpbw1M11OTG26u7/it8FIRlBoaHEAAByEg5GoMDDKIAgoJU/XBwDROiziNCZhYnN2dITQT0L949/cfXDf4+GTlprctrLFVUrXaGD53NvciYXkqqNQT2U6OUaoRUb9+eLuwyn36LDz0FP22IH445n9+NL1xj702XD999VjzWu1AAAO5UlEQVR4nO2dj2PaxhXHTzISQgKEhYzMDzsEnDayFztO7NEVW65pApl/JOkaL8kar126dXXn/Gz7/++9O0kIW8LgABJU3zj48KHjPnrv3p1O0omQWLFixYoVK1asWLFixZomifAjip53sywAnUVCZJJQdUly3s+URFJ/2G7a2q7PIqD+KNnVvh52hUYokTU7fX/XQ7hLEWekOYo0hNYp4G67U+u0HURxJvjsLsK2YHufs7hHiLi7O0OOioSHwARcHa6gFriO7ajSDAXUnSY1YbNtFf5asB41KWFzZ2YIRdJqMrPVrLVc1kqxaNNcD7tiI5NLmEwdWJb10CZMrs+KCT2EydSTw3YtOcuEu8l2t1OcSULsJpxU9NuhyDoCfQAd3fbT8SCbSmxQFErYpWOxQnphECV8Nci26eMb9sBv8ojwlUcBVR+pFo4l77HzRHUMgOmDdP8KZofO8Ch9AF+xkJNCGsO2FhLpVOqw3bnKkrkBWHz5ak9up1LpRPpo8q0Q24UEYI9zlmwVHlPEdIbzlywHZAQqQ/0i3SnQ0iGlT/xAC79uJ51IZi0V/s23+xIOL0bYztHSs1B6K4RYKpLjRKKTsfaTNc7qjIWww1lPbrdlDox4HAohtK7HHJe9A2PN2ngILSt7Jy1bQJibNB4VELYL1kHmkFNHbUOOEtZU7jBzYKkpJAzBhEh4AB4qW1b7ACuUhZgyKkIaSg/aFpTOPYHSs5PmcwgTt2vZQi6VpCYsjJBwniIma7lCtnY7ESZhIp1s77PuMDtCJ+UyrENcgEMRWnqIhF0VRkUn408h2zPoiQThqAApoSzn0gwxGxHC9PzIAB3lvOPdsAmz2QLu9lEKENVsOhKEudz8vHqdsecAUgvzuZAJ7U4e93lGHa26kRkHOOERqjYhVwBTjlKFnB2bZTmTDZ8Q9vO8MmrNZ2zHjwahOq/w/JWV5odRQY0WYUHhBwMYzICUkIsaIW9KV8gczoYRIpQHI0TAwT01ioRXmXAYCypTSGjqs044DN9UEg4HGElCpR/hAFFUcfsbRdGVaSM07ZorLsOllOIOGWjAjSJhv95iELfsjnkU+i+KhJKkF21VActJP5V0vlhmWgeAdTtd9KTLvK5/84Wt+zy4aSQJTfK3B/eY7lbJt8+c9Dp/smen98pm2U2fmkd37fSzM/Obr/9i6++R9VJJKm3aWlonG+zNzc1K2dxyMiqn5nbF+dCfzDUnWTL4r14+Z/ry+X0+kpGGEhqCgD9GBQgFTMDb0pq5JeAbfLttbpcE9iEBCHEDlsV/9WdHX96Prg0XobaL+GITLr6AlxLa0DAWFwFtEwkN+DukDUpoLL7ADdCGAPfyH99Fn7BYfVWyCReL1dNFasNNoVKunlSEErXh0km1vMQIhcpptVgSbBv+83vxh4gTGpXqv4pkRSghYeVpvUheUcJS6TV5TU4XKWHpBNLlEiN8RV7X1yvMhi+///HfL6NLqFAbLpPiHjlZpITL+tO7YnGRtsNK9cbd+tMlRrhev1u9sUQJS2Wy91S/xWz4H/KT+PPLSBOWjBdFUienJeqlYKs62IoSlk5JXVx/sXmI7fAVkcQdRihsSBLR7zAb/kCe/5c8jzQhtMM7RpE4kWYJLLTBYqmxWDkhr0o00gilW6fkhHrpolG69W29WBEEJPxO/Pmnn6JtQ6jwCZHcSLNFoOkZLNKcEVJ2Io1BSHHJYLG0IpEWAAos0vz4Y9RjqSGsbCzBK22HgnG2tChQQqA6q4CFGWHnbLPCegv46JmxJAjMhlPSH1JV1s0NJ037Qydt9/hUtB3aMsyeHj+6YxqX8BgIDSpKaKeNTRi1bdppNqahKfiPNvwy+jb8zNEDIHTSy2XzlZsBhPec9Jm55qZvKl/9xdV9JbI2fL33OdMvCr/+zE7f3OFbnzva4XduOukW3/jFTj4rKvf/97WtLyI6i4GE7NYtyZ5V85tc0wPSyHTflsJHcxajOxPVrfPAuvTRSBMOztUXObqEIwGMMuFoAEMmFPsQjgjwImGOOBcnTuRiYZFdxe5HGFxhGkwGOkmq+BAmbLqJXNDufoUPYd+KKwNHV+XSfGnP1ZdjZhSJ1Fqjyl6aTbzSMoFvLwBqF/vDBPvKljSJ+8D1ZHO3mWw2m+mLhH3qvQH/jzVeKcMnypBubfcj1C4T7uMN0rtNvPN0vITO7a4oH8JACYrOH6/xjQctfn0bdkRrywzcAAAvE3pvkR6vDevdO7KHIVzhtXLjzDx+eGJuHwFEa6u81fA/ZYqA2qVI470LfIyEYMFHu9cjVEoNvsRvNZ6YBn6ytbRzJPB+bk0B+xDuPhrn/cOi5L3lfBjCDQMqvaWdmRvaK/P0tKyBl674A8r9CcGK9TEiHjevSSgcQaxBHz3ZPsYTaa0ttOvl7hEA+xPC9zfXxkiYZPecN4cnNIFO22sprQcNfN/aUnjjMqENKPsT7jbb9PbF5jgJka9zuN/B7xuGcB07CewrlDL1zca6wh/7WJDJn3C3s39Yw3uIx0zYbsuWVegMaUNaf+d30EcdwADCTsGyrP322Ak7qvrw0DpoX4+we6KeDlV7NrKDTBBh+9A6zBbUzvgJM9zjAyubGp6Q2c+BuzyOs4OMhr99CFNZ6+BFxhoroUgeJXdr86qas/ab1yPsY12t66O+Y5pm28qpamHMhPvQG9UKFndwnXbYH1LzXsfuO2qrHXBWodaEkDo2QhZLk51aJzVsb3EVn2LbzpHvuDQF39xMjpfw0LuKzgi9VNF6TOhvQ7fT3x8joWflgJHasHFR/UZt41ypQCQPm2yhmV5CvEb4UwD9pPRc551whmzgow/HB4h62PSxISd/cqTxI/S1YXN7rHwiWtFZ2cJLmJnPaKOVnMv4EQLgOA+A6coGrhW9Xoo38IxYbtEeQnTRcc5i2HN5a6kmXVrOa8Mx3PXkFkkJ2Up2qTVpbHReTH2HKuG14RhFCdlXTnh5sNwECUM4bzFhQvtu9clM6Yv2pP6EbTjxZTGuRYjjMcuSh4xLHi+d5BouQxDK7EdrdOOgqciMeEjCSWpYG2ombKTDAFSDQSeGRFMb1JLRJwRLyWA+HpEyXAaHKhmNJ0TSBluDIfqEHKcQUdeoo/K6DkcSyCoDozLQ1lNAqBNJRrN126HEI7BEdHkAM0aZkNUeQKAd8p4t6TJvGkOfekIZAHku03ACvX2CE981OK5BpKsXRIkyIYpHQJ50+zKRnNspyFDgZcoJG+iivOgCwuv5m7eEDYx4dNTGVUVEm1BGN+TtQSV7Ed+tnjtl8BhutKkm5MFEGnH9EwHfr745dwvBXD3D9Q2pkSbUMFh2F0TGKPNhdfWdc5wgYjeikyu6jEgTogkVz7yDSN6urq6+d0qgfqpdFWwiTShJ2B12oyj5CICrb7tliAS7k/6FRJZQ5qh5GqTbCZLzX5Hwo4sHakCP0T/WRJaQw/GoxrGpFVGk16S9Q0AIpZ7L0yTYD/3Hp1Em1KkPMkJ8eU8BfyV2d8jKAT82p5VQhmYouyQ0jKJ+c96z31oGW+sUEkIXgIRat7d/ywBX37xDfXAIGxm9f6gJmTDw2ABH3XagYZ///c2qV05ABUJejDIhJ6tz6pyP8I+Ez8vOBiyMuvrg9pHanEL8CrCLCZ+Qg2rkfTU3J/F51Zno/NAD+L57haGc50lACVhI+ITyXD7QAJKUnxOdAfc56jcG+M5zekXN6xLdH5cVDUIOCH0NCBXkJfBU96gJxQh/PXf+Ai9zeUkPNGEkCP13PyVsQPV50e3f4TeNNm9+9/QWZn6ONIKKiDrhXAYamUbcBdVh1NYbRvFvDQhGcvBOijhhnuj5ue4QjR1ZeMIo/kmlgWZqCRUE8KyJ/8E9dnKK4WEX8FNMqEITUz1e+r43jBKMpA2S6VNC1AnzOnigRuzDXVH8lYZR53ARZxShO9GDC4g8IRqRB0zRtuL56puPxDOngf7JgxmnlxD6swYGSucw/yMNo10nldDAgV3FVBDCPxNtJDGf/P1tt+sAmWhjqc+YKPqEFFFCRJ3YntqdOUUXVTHUTDUhCigy+bzsOdandpTkPAXsv/FUEOZViWjwIU1yQirBs6PQSDUiqX19dFoI83M8oMCvTEOnN7TrDTBqXtWJfgXftBCitUSiZ9xDDhSejkI70g9MOSElmmuIeOJXpSZVZTwd3JhzgKNO2L+KLuWcxmZOWcTRtSsdNEqEA1UVP5XRGgqvNLSMGnBQ77NVyIRZNk8zoNzJANwpg1meEoa5JnuWzrUNyOeJM4PvFVWmhCE8ScczIzwo4nVEyw+HEHSUSCRG/1iLyyokwnneEyE7C8yII36yRe9DLqAVgAkXQnrsbJo+nETNjFPqPP0WKZwHXO/QZ8Ckx6uFRDaRBhOG8oRHfDzgJJRuke4E64S1kx4/YxosGAoc26uSdpzNZpk/QaK3blmvt13IdLfy29KbmduZwC0WgYSXApy7/Bou2Vbuzbux58l8Vu3NLHq33LvAFJIFiXNy3luR5ZtdfeYlhLwbDzyZ96q95RTveTKf1UXPdiRMROKdWBIvEC5ftGEwIdjwM0/mg3EuC/EJQsKK4Whzs3LRhstGN3e52ptZrBibsA37WQ6v5fUVErorQ+I60BdteMeTuVTtzSy6q2YKhjArhKJ3Sw+hMC2ERj9Co4cQkkXvlhEmFHG53FqqRtdc9yWkmRdtCELCTi21YhjRtiEQGrVUCigCCDFzBTP9CCEvNQWEAiMMaIdPHPwgwpWIt0OHMOVPaFCIqSdMfSphpHuLK710JmwYE8aEMWGIigljwpgwfMWEMWFMGL5iwpgwJgxfMWFMGBOGr5jwD09oTBVhwIywQxhwZuYPQzgVc96BhE+m34aG0Pfs2tWEkT+7ZhgrKfsUoQ8hzcQ830gD+6YW6fOHWGU8ByxQT/M9y20IKyyz90oFvBZjEdCczDtSqBfQBMshFPwIxYGvxUAbRpMQa1Vxnjd6yUuR0OhmXiJ8IXRzwYaRRMRKPbjlarnnujao8o1nnsy9au+WRc+Wt/bq4V7nFShRFOs96rme5ELmBYTADadJQ1R7SgljxYoVK1asWLFixYoVa5r1f1XwAoT72uBSAAAAAElFTkSuQmCC" 
              alt="BESCOM" 
              className="nav-logo"
            />
            <div className="nav-title">
              <h2>Energy Management Admin Panel</h2>
              <p>Power Grid Management System</p>
            </div>
          </div>
          
          <div className="admin-user">
            {/* <span className="admin-name">Welcome</span> */}
            <button className="logout-btn" onClick={onLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* Navigation tabs in customer portal style */}
        <nav className="admin-nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 System Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'consumers' ? 'active' : ''}`}
            onClick={() => setActiveTab('consumers')}
          >
            👥 Consumers ({consumers.length})
          </button>
          <button 
            className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🚨 Active Alerts ({alerts.length})
          </button>
          <button 
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 System Analytics
          </button>
        </nav>

        {/* Main content area */}
        <main>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'consumers' && renderConsumers()}
          {activeTab === 'alerts' && renderAlerts()}
          {activeTab === 'analytics' && renderAnalytics()}
        </main>
      </div>

      {selectedConsumer && (
        <div className="modal-overlay" onClick={() => setSelectedConsumer(null)}>
          <div className="consumer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Consumer Details</h3>
              <button className="close-btn" onClick={() => setSelectedConsumer(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="consumer-info">
                <div className="info-section">
                  <h4>Basic Information</h4>
                  <div className="info-grid">
                    <div><span>ID:</span> {selectedConsumer.id}</div>
                    <div><span>Name:</span> {selectedConsumer.name}</div>
                    <div><span>Email:</span> {selectedConsumer.email}</div>
                    <div><span>Address:</span> {selectedConsumer.address}</div>
                  </div>
                </div>
                
                <div className="info-section">
                  <h4>Current Usage</h4>
                  <div className="usage-grid">
                    <div className="usage-item">
                      <span>Current:</span>
                      <span>{selectedConsumer.currentUsage} A</span>
                    </div>
                    <div className="usage-item">
                      <span>Power:</span>
                      <span>{selectedConsumer.powerUsage} W</span>
                    </div>
                    <div className="usage-item">
                      <span>Voltage:</span>
                      <span>{selectedConsumer.voltage} V</span>
                    </div>
                    <div className="usage-item">
                      <span>Balance:</span>
                      <span>₹{selectedConsumer.balance}</span>
                    </div>
                  </div>
                </div>
                
                <div className="info-section">
                  <h4>Recent Transactions</h4>
                  <div className="transactions-list">
                    {selectedConsumer.rechargeHistory.map((transaction, index) => (
                      <div key={index} className="transaction-item">
                        <span>{transaction.date}</span>
                        <span className={transaction.type}>{transaction.type}</span>
                        <span>₹{transaction.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;