import cv2
from ultralytics import YOLO
import time
import os
import socket
import subprocess
import urllib.parse

# ============ YOUR CAMERA CREDENTIALS ============
USERNAME = "admin"
PASSWORD = "admin@123"  # Change if different
CAMERA_IP = "192.168.29.11"
# =================================================

print("="*70)
print("CP PLUS CAMERA DIAGNOSTIC & PERSON DETECTION TOOL")
print("="*70)

# Step 1: Check if camera is reachable
print("\n[STEP 1] Checking if camera is reachable...")
print(f"Pinging {CAMERA_IP}...")

try:
    # Ping camera
    response = subprocess.run(['ping', '-n', '1', CAMERA_IP], 
                            capture_output=True, text=True, timeout=5)
    if response.returncode == 0:
        print(f"✓ Camera is REACHABLE at {CAMERA_IP}")
    else:
        print(f"✗ Camera is NOT reachable at {CAMERA_IP}")
        print("\n⚠️ CRITICAL: Cannot reach camera!")
        print("Please verify:")
        print(f"  1. Camera IP is correct: {CAMERA_IP}")
        print("  2. Camera is powered on")
        print("  3. Computer and camera are on same network/WiFi")
        print("  4. No firewall blocking")
        cont = input("\nContinue anyway? (y/n): ")
        if cont.lower() != 'y':
            exit()
except Exception as e:
    print(f"✗ Could not ping camera: {e}")

# Step 2: Scan for open ports
print("\n[STEP 2] Scanning for open ports...")
common_ports = [80, 554, 8000, 8080, 8081, 8554, 9000]
open_ports = []

for port in common_ports:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((CAMERA_IP, port))
        if result == 0:
            print(f"✓ Port {port} is OPEN")
            open_ports.append(port)
        else:
            print(f"✗ Port {port} is closed")
        sock.close()
    except:
        print(f"✗ Port {port} - error scanning")

if not open_ports:
    print("\n⚠️ WARNING: No common camera ports are open!")
    print("The camera might be:")
    print("  1. Off or not connected to network")
    print("  2. Using non-standard ports")
    print("  3. Behind a firewall")
    manual_port = input("\nEnter port number to try (or press Enter to exit): ")
    if manual_port:
        open_ports = [int(manual_port)]
    else:
        exit()

# Step 3: Load YOLO model
print("\n[STEP 3] Loading YOLO model...")
model = YOLO('yolov8n.pt')
print("✓ YOLO model loaded successfully!")

# Step 4: Try connecting to camera
print("\n[STEP 4] Testing camera connections...")
print("="*70)

# Build URL list based on open ports
test_urls = []
encoded_password = urllib.parse.quote(PASSWORD)

for port in open_ports:
    # HTTP URLs
    test_urls.extend([
        f'http://{CAMERA_IP}:{port}/video',
        f'http://{USERNAME}:{PASSWORD}@{CAMERA_IP}:{port}/video',
        f'http://{USERNAME}:{PASSWORD}@{CAMERA_IP}:{port}/videostream.cgi',
        f'http://{USERNAME}:{PASSWORD}@{CAMERA_IP}:{port}/cgi-bin/mjpeg',
    ])
    
    # RTSP URLs
    test_urls.extend([
        f'rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{port}/cam/realmonitor?channel=1&subtype=0',
        f'rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{port}/h264/ch01/main/av_stream',
        f'rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{port}/live',
        f'rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{port}/stream1',
        f'rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{port}/Streaming/Channels/101',
    ])

def quick_test(url, timeout=3):
    """Quick connection test"""
    try:
        cap = cv2.VideoCapture(url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        start = time.time()
        while time.time() - start < timeout:
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    return cap, frame.shape
            time.sleep(0.1)
        cap.release()
    except:
        pass
    return None, None

cap = None
working_url = None

for i, url in enumerate(test_urls, 1):
    display_url = url.replace(PASSWORD, '***')
    print(f"\n[{i}/{len(test_urls)}] Testing: {display_url}")
    
    test_cap, shape = quick_test(url, timeout=3)
    
    if test_cap:
        cap = test_cap
        working_url = url
        print(f"✓✓✓ SUCCESS! Frame size: {shape}")
        print(f"\n{'='*70}")
        print("CAMERA CONNECTED!")
        print(f"{'='*70}")
        break
    else:
        print("✗ Failed")

if cap is None:
    print("\n" + "="*70)
    print("❌ COULD NOT CONNECT TO CAMERA")
    print("="*70)
    print("\n🔍 DIAGNOSIS:")
    print(f"  Camera IP: {CAMERA_IP}")
    print(f"  Open ports: {open_ports if open_ports else 'None found'}")
    print(f"  Username: {USERNAME}")
    print(f"  Password: {'*' * len(PASSWORD)}")
    
    print("\n📋 NEXT STEPS:")
    print("\n1. VERIFY CAMERA SETTINGS:")
    print("   - Open CP Plus ConfigTool or camera web interface")
    print("   - Check if RTSP/ONVIF is enabled")
    print("   - Verify username and password")
    
    print("\n2. CHECK IP ADDRESS:")
    print("   - Is 192.168.29.11 the current camera IP?")
    print("   - Use CP Plus ConfigTool to find camera")
    print("   - Check router's connected devices list")
    
    print("\n3. TEST IN OTHER SOFTWARE:")
    print("   - VLC: Media → Open Network Stream")
    print("   - Try: rtsp://admin:admin@192.168.29.11:554/...")
    print("   - CP Plus EzyKam mobile app")
    
    print("\n4. NETWORK ISSUES:")
    print("   - Ensure PC and camera on same network")
    print("   - Disable VPN")
    print("   - Check Windows Firewall")
    
    print("\n5. MANUAL URL ENTRY:")
    manual_url = input("\nIf you know the working URL, enter it here: ")
    if manual_url:
        cap = cv2.VideoCapture(manual_url)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                working_url = manual_url
                print("✓ Manual URL works!")
            else:
                print("✗ Can't read frames from manual URL")
                exit()
        else:
            print("✗ Manual URL failed")
            exit()
    else:
        exit()

# Detection functions
def detect_persons(frame, model, conf_threshold=0.5):
    results = model(frame, verbose=False, conf=conf_threshold)
    person_count = 0
    detections = []
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            if cls == 0:
                conf = float(box.conf[0])
                if conf > conf_threshold:
                    person_count += 1
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    detections.append({
                        'bbox': (x1, y1, x2, y2),
                        'confidence': conf
                    })
    return person_count, detections

def draw_detections(frame, detections, person_count, fps):
    for detection in detections:
        x1, y1, x2, y2 = detection['bbox']
        conf = detection['confidence']
        
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
        
        label = f'Person {conf:.2f}'
        (text_width, text_height), _ = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
        )
        
        cv2.rectangle(frame, (x1, y1 - text_height - 10),
                     (x1 + text_width, y1), (0, 255, 0), -1)
        cv2.putText(frame, label, (x1, y1 - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (500, 100), (0, 0, 0), -1)
    frame = cv2.addWeighted(overlay, 0.6, frame, 0.4, 0)
    
    cv2.putText(frame, f'Persons: {person_count}', (10, 35),
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    cv2.putText(frame, f'FPS: {fps:.1f}', (10, 75),
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    cv2.putText(frame, 'Q=Quit | S=Screenshot', (10, frame.shape[0] - 20),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    return frame

# Main detection loop
print("\n" + "="*70)
print("STARTING PERSON DETECTION")
print("="*70)
print(f"URL: {working_url.replace(PASSWORD, '***')}")
print("Press 'q' to quit | Press 's' for screenshot")
print("="*70 + "\n")

fps = 0
frame_count = 0
start_time = time.time()
screenshot_count = 0

try:
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("Lost connection...")
            break
        
        person_count, detections = detect_persons(frame, model)
        
        frame_count += 1
        if frame_count >= 30:
            fps = 30 / (time.time() - start_time)
            frame_count = 0
            start_time = time.time()
        
        frame = draw_detections(frame, detections, person_count, fps)
        cv2.imshow('Person Detection - CP Plus', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s'):
            screenshot_count += 1
            filename = f'detection_{screenshot_count}.jpg'
            cv2.imwrite(filename, frame)
            print(f"Saved: {filename}")

except KeyboardInterrupt:
    print("\nStopped by user")
finally:
    cap.release()
    cv2.destroyAllWindows()
    print(f"\nTotal screenshots: {screenshot_count}")