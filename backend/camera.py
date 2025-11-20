# import cv2
# import time
# import os
# import subprocess
# from onvif import ONVIFCamera
# import zeep
# import urllib.parse

# # Camera credentials
# USERNAME = "admin"
# PASSWORD = "admin@123"
# CAMERA_IP = "192.168.29.11"
# PORT = 8000  # The open port we discovered

# def zeep_pythonvalue(self, xmlvalue):
#     """Custom converter for zeep to handle xsd:dateTime values properly"""
#     return xmlvalue

# # Patch zeep to handle custom data types
# zeep.xsd.simple.AnySimpleType.pythonvalue = zeep_pythonvalue

# def get_stream_uri(mycam, profile):
#     """Get the stream URI from a camera profile"""
#     try:
#         media_service = mycam.create_media_service()
        
#         # Get stream URI
#         request = media_service.create_type('GetStreamUri')
#         request.ProfileToken = profile.token
#         request.StreamSetup = {'Stream': 'RTP-Unicast', 'Transport': {'Protocol': 'RTSP'}}
        
#         response = media_service.GetStreamUri(request)
#         return response.Uri
#     except Exception as e:
#         print(f"Error getting stream URI: {e}")
#         return None

# def main():
#     print("=== CP Plus Camera ONVIF Connection Tool (Fixed) ===")
    
#     # Try to connect directly to the known camera on port 8000
#     try:
#         print(f"Connecting to ONVIF camera at {CAMERA_IP}:{PORT}...")
        
#         # Connect without the no_verification parameter
#         mycam = ONVIFCamera(CAMERA_IP, PORT, USERNAME, PASSWORD)
        
#         # Get device information
#         try:
#             device_info = mycam.devicemgmt.GetDeviceInformation()
#             print(f"✓ Successfully connected to camera via ONVIF!")
#             print(f"Device Information:")
#             print(f"  Manufacturer: {device_info.Manufacturer}")
#             print(f"  Model: {device_info.Model}")
#             print(f"  Firmware Version: {device_info.FirmwareVersion}")
#             print(f"  Serial Number: {device_info.SerialNumber}")
#         except Exception as e:
#             print(f"Could not get device info: {e}")
        
#         # Get camera profiles
#         media_service = mycam.create_media_service()
#         profiles = media_service.GetProfiles()
        
#         print(f"\nFound {len(profiles)} stream profiles:")
        
#         streaming_urls = []
        
#         # Try each profile to get a stream URL
#         for i, profile in enumerate(profiles):
#             print(f"\nProfile {i+1}: {profile.Name}")
            
#             # Get stream URI
#             stream_uri = get_stream_uri(mycam, profile)
#             if stream_uri:
#                 print(f"✓ RTSP Stream URI: {stream_uri}")
#                 streaming_urls.append(stream_uri)
#             else:
#                 print("✗ Could not get RTSP Stream URI")
        
#         if not streaming_urls:
#             print("✗ No streaming URLs found via ONVIF.")
            
#             # Try some common URL patterns for CP Plus cameras since we know the camera exists
#             encoded_password = urllib.parse.quote(PASSWORD)
#             common_urls = [
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/cam/realmonitor?channel=1&subtype=0",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/h264/ch01/main/av_stream",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/Streaming/Channels/101",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/live/ch00_0",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/live",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/stream"
#             ]
            
#             print("\nTrying common CP Plus URL patterns:")
#             for url in common_urls:
#                 print(f"Testing: {url}")
#                 streaming_urls.append(url)
            
#         # Try to stream the video
#         success = False
#         for url in streaming_urls:
#             print(f"\nAttempting to stream video from URL: {url}")
            
#             # Set RTSP transport to TCP using environment variable
#             os.environ["OPENCV_FFMPEG_TRANSPORT_OPTION"] = "rtsp_transport=tcp"
            
#             # Use OpenCV to display the stream
#             cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
            
#             if not cap.isOpened():
#                 print("✗ Failed to open video stream with this URL")
#                 continue
            
#             # Try to read a frame to verify
#             ret, frame = cap.read()
#             if not ret:
#                 print("✗ Could not read frames from this URL")
#                 cap.release()
#                 continue
            
#             print("✓ Successfully opened video stream!")
#             print(f"Working URL: {url}")
#             print("Displaying video. Press 'q' to exit.")
#             success = True
            
#             try:
#                 while True:
#                     ret, frame = cap.read()
#                     if not ret:
#                         print("✗ Failed to get frame")
#                         break
                        
#                     cv2.imshow('CP Plus Camera Feed', frame)
#                     if cv2.waitKey(1) & 0xFF == ord('q'):
#                         break
#             except Exception as e:
#                 print(f"Error during streaming: {e}")
#             finally:
#                 cap.release()
#                 cv2.destroyAllWindows()
                
#             if success:
#                 break
        
#         if not success:
#             print("\n✗ Could not stream from any URL.")
#             print("\nAlternative options:")
#             print("1. Use the RTSP URL in VLC media player to test")
#             print("2. Access the camera's web interface at http://192.168.29.48:8000")
#             print("3. Install CP Plus EzyKam or IVMS software")
        
#     except Exception as e:
#         print(f"Error connecting to camera: {e}")
#         print("\nTrying alternative methods...")
        
#         # Try using ffprobe to detect RTSP streams directly
#         encoded_password = urllib.parse.quote(PASSWORD)
#         test_url = f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}"
        
#         try:
#             print("\nUsing ffprobe to detect streams (if installed)...")
#             result = subprocess.run(['ffprobe', '-v', 'error', '-rtsp_transport', 'tcp', 
#                                      '-i', test_url], 
#                                     stderr=subprocess.PIPE, text=True, timeout=10)
            
#             print(result.stderr)
#             if "Error" not in result.stderr:
#                 print("✓ ffprobe detected a valid stream!")
#         except:
#             print("ffprobe not available or couldn't detect streams")
            
#         print("\nRecommendations:")
#         print(f"1. Try accessing the web interface at http://{CAMERA_IP}:{PORT}")
#         print("2. Use the CP Plus EzyKam mobile app")
#         print("3. Check your camera documentation for the exact RTSP URL format")

# if __name__ == "__main__":
#     main()






# import cv2
# import time
# import os
# import subprocess
# from onvif import ONVIFCamera
# import zeep
# import urllib.parse
# from ultralytics import YOLO

# # Camera credentials
# USERNAME = "admin"
# PASSWORD = "admin@123"
# CAMERA_IP = "192.168.29.11"
# PORT = 8000

# # Load YOLOv8 model for person detection
# print("Loading YOLOv8 model...")
# model = YOLO('yolov8n.pt')  # You can use yolov8s.pt, yolov8m.pt, yolov8l.pt, yolov8x.pt for better accuracy

# def zeep_pythonvalue(self, xmlvalue):
#     """Custom converter for zeep to handle xsd:dateTime values properly"""
#     return xmlvalue

# # Patch zeep to handle custom data types
# zeep.xsd.simple.AnySimpleType.pythonvalue = zeep_pythonvalue

# def get_stream_uri(mycam, profile):
#     """Get the stream URI from a camera profile"""
#     try:
#         media_service = mycam.create_media_service()
        
#         # Get stream URI
#         request = media_service.create_type('GetStreamUri')
#         request.ProfileToken = profile.token
#         request.StreamSetup = {'Stream': 'RTP-Unicast', 'Transport': {'Protocol': 'RTSP'}}
        
#         response = media_service.GetStreamUri(request)
#         return response.Uri
#     except Exception as e:
#         print(f"Error getting stream URI: {e}")
#         return None

# def detect_persons(frame):
#     """Detect persons in the frame using YOLOv8"""
#     try:
#         # Run inference - detect only person class (class 0) with confidence > 0.5
#         results = model.predict(
#             frame, 
#             classes=[0],  # Only detect person class (class 0 in COCO dataset)
#             conf=0.5,     # Confidence threshold
#             verbose=False # Suppress verbose output
#         )
        
#         person_count = 0
        
#         # Process results
#         for result in results:
#             boxes = result.boxes
#             if boxes is not None:
#                 for box in boxes:
#                     # Get bounding box coordinates
#                     x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
#                     confidence = box.conf[0].cpu().numpy()
#                     class_id = int(box.cls[0].cpu().numpy())
                    
#                     # Draw bounding box
#                     cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                    
#                     # Add label with confidence
#                     label = f'Person: {confidence:.2f}'
#                     label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
#                     cv2.rectangle(frame, (int(x1), int(y1-label_size[1]-10)), 
#                                 (int(x1+label_size[0]), int(y1)), (0, 255, 0), -1)
#                     cv2.putText(frame, label, (int(x1), int(y1-5)), 
#                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
                    
#                     person_count += 1
        
#         # Display person count
#         cv2.putText(frame, f'Persons Detected: {person_count}', (10, 30), 
#                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
#         return frame, person_count
        
#     except Exception as e:
#         print(f"Error in person detection: {e}")
#         return frame, 0

# def main():
#     print("=== CP Plus Camera ONVIF Connection Tool with Person Detection ===")
    
#     # Try to connect directly to the known camera on port 8000
#     try:
#         print(f"Connecting to ONVIF camera at {CAMERA_IP}:{PORT}...")
        
#         # Connect without the no_verification parameter
#         mycam = ONVIFCamera(CAMERA_IP, PORT, USERNAME, PASSWORD)
        
#         # Get device information
#         try:
#             device_info = mycam.devicemgmt.GetDeviceInformation()
#             print(f"✓ Successfully connected to camera via ONVIF!")
#             print(f"Device Information:")
#             print(f"  Manufacturer: {device_info.Manufacturer}")
#             print(f"  Model: {device_info.Model}")
#             print(f"  Firmware Version: {device_info.FirmwareVersion}")
#             print(f"  Serial Number: {device_info.SerialNumber}")
#         except Exception as e:
#             print(f"Could not get device info: {e}")
        
#         # Get camera profiles
#         media_service = mycam.create_media_service()
#         profiles = media_service.GetProfiles()
        
#         print(f"\nFound {len(profiles)} stream profiles:")
        
#         streaming_urls = []
        
#         # Try each profile to get a stream URL
#         for i, profile in enumerate(profiles):
#             print(f"\nProfile {i+1}: {profile.Name}")
            
#             # Get stream URI
#             stream_uri = get_stream_uri(mycam, profile)
#             if stream_uri:
#                 print(f"✓ RTSP Stream URI: {stream_uri}")
#                 streaming_urls.append(stream_uri)
#             else:
#                 print("✗ Could not get RTSP Stream URI")
        
#         if not streaming_urls:
#             print("✗ No streaming URLs found via ONVIF.")
            
#             # Try some common URL patterns for CP Plus cameras
#             encoded_password = urllib.parse.quote(PASSWORD)
#             common_urls = [
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/cam/realmonitor?channel=1&subtype=0",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/h264/ch01/main/av_stream",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/Streaming/Channels/101",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/live/ch00_0",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/live",
#                 f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/stream"
#             ]
            
#             print("\nTrying common CP Plus URL patterns:")
#             for url in common_urls:
#                 print(f"Testing: {url}")
#                 streaming_urls.append(url)
            
#         # Try to stream the video with person detection
#         success = False
#         for url in streaming_urls:
#             print(f"\nAttempting to stream video from URL: {url}")
            
#             # Set RTSP transport to TCP using environment variable
#             os.environ["OPENCV_FFMPEG_TRANSPORT_OPTION"] = "rtsp_transport=tcp"
            
#             # Use OpenCV to display the stream
#             cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
            
#             if not cap.isOpened():
#                 print("✗ Failed to open video stream with this URL")
#                 continue
            
#             # Try to read a frame to verify
#             ret, frame = cap.read()
#             if not ret:
#                 print("✗ Could not read frames from this URL")
#                 cap.release()
#                 continue
            
#             print("✓ Successfully opened video stream!")
#             print(f"Working URL: {url}")
#             print("Displaying video with person detection. Press 'q' to exit, 's' to save screenshot.")
#             success = True
            
#             frame_count = 0
#             fps_counter = 0
#             fps_timer = time.time()
            
#             try:
#                 while True:
#                     ret, frame = cap.read()
#                     if not ret:
#                         print("✗ Failed to get frame")
#                         break
                    
#                     # Apply person detection every 3rd frame for better performance
#                     if frame_count % 3 == 0:
#                         frame, person_count = detect_persons(frame)
                    
#                     # Calculate FPS
#                     fps_counter += 1
#                     if time.time() - fps_timer >= 1.0:
#                         fps = fps_counter
#                         fps_counter = 0
#                         fps_timer = time.time()
#                         print(f"FPS: {fps}, Persons: {person_count}")
                    
#                     # Display FPS on frame
#                     cv2.putText(frame, f'FPS: {fps_counter}', (10, 70), 
#                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    
#                     cv2.imshow('CP Plus Camera - Person Detection', frame)
                    
#                     key = cv2.waitKey(1) & 0xFF
#                     if key == ord('q'):
#                         break
#                     elif key == ord('s'):
#                         # Save screenshot
#                         screenshot_name = f"person_detection_{int(time.time())}.jpg"
#                         cv2.imwrite(screenshot_name, frame)
#                         print(f"Screenshot saved: {screenshot_name}")
                    
#                     frame_count += 1
                    
#             except Exception as e:
#                 print(f"Error during streaming: {e}")
#             finally:
#                 cap.release()
#                 cv2.destroyAllWindows()
                
#             if success:
#                 break
        
#         if not success:
#             print("\n✗ Could not stream from any URL.")
#             print("\nAlternative options:")
#             print("1. Use the RTSP URL in VLC media player to test")
#             print("2. Access the camera's web interface at http://192.168.29.48:8000")
#             print("3. Install CP Plus EzyKam or IVMS software")
        
#     except Exception as e:
#         print(f"Error connecting to camera: {e}")
#         print("\nTrying alternative methods...")
        
#         # Try using ffprobe to detect RTSP streams directly
#         encoded_password = urllib.parse.quote(PASSWORD)
#         test_url = f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}"
        
#         try:
#             print("\nUsing ffprobe to detect streams (if installed)...")
#             result = subprocess.run(['ffprobe', '-v', 'error', '-rtsp_transport', 'tcp', 
#                                      '-i', test_url], 
#                                     stderr=subprocess.PIPE, text=True, timeout=10)
            
#             print(result.stderr)
#             if "Error" not in result.stderr:
#                 print("✓ ffprobe detected a valid stream!")
#         except:
#             print("ffprobe not available or couldn't detect streams")
            
#         print("\nRecommendations:")
#         print(f"1. Try accessing the web interface at http://{CAMERA_IP}:{PORT}")
#         print("2. Use the CP Plus EzyKam mobile app")
#         print("3. Check your camera documentation for the exact RTSP URL format")

# if __name__ == "__main__":
#     main()






import cv2
import time
import os
import subprocess
from onvif import ONVIFCamera
import zeep
import urllib.parse
from ultralytics import YOLO
import pyrebase
import threading
from datetime import datetime

# Camera credentials
USERNAME = "admin"
PASSWORD = "admin@123"
CAMERA_IP = "192.168.29.11"
PORT = 8000

# Firebase configuration using Pyrebase (works with client-side config)
FIREBASE_CONFIG = {
  "apiKey": "AIzaSyBi4imuMT5imCT-8IBULdyFqj-ZZtl68Do",
  "authDomain": "regal-welder-453313-d6.firebaseapp.com",
  "databaseURL": "https://regal-welder-453313-d6-default-rtdb.firebaseio.com",
  "projectId": "regal-welder-453313-d6",
  "storageBucket": "regal-welder-453313-d6.firebasestorage.app",
  "messagingSenderId": "981360128010",
  "appId": "1:981360128010:web:5176a72c013f26b8dbeff3",
  "measurementId": "G-T67CCEJ8LW"
}

# Initialize Firebase with Pyrebase
try:
    firebase = pyrebase.initialize_app(FIREBASE_CONFIG)
    db = firebase.database()
    print("✓ Firebase (Pyrebase) initialized successfully")
except Exception as e:
    print(f"✗ Firebase initialization failed: {e}")
    print("Installing pyrebase: pip install pyrebase4")

# Load YOLOv8 model for person detection
print("Loading YOLOv8 model...")
model = YOLO('yolov8n.pt')

# Global variables for theft detection
last_theft_alert = 0
THEFT_COOLDOWN = 30  # Seconds between alerts to prevent spam

def zeep_pythonvalue(self, xmlvalue):
    """Custom converter for zeep to handle xsd:dateTime values properly"""
    return xmlvalue

# Patch zeep to handle custom data types
zeep.xsd.simple.AnySimpleType.pythonvalue = zeep_pythonvalue

def send_theft_alert():
    """Send theft alert to Firebase database"""
    global last_theft_alert
    current_time = time.time()
    
    # Check cooldown to prevent spam
    if current_time - last_theft_alert < THEFT_COOLDOWN:
        return
    
    try:
        # Send alert data to BESCOM/Theft path
        alert_data = {
            'value': 1,
        }
        
        # Update the Firebase database
        db.child("BESCOM").child("Theft").set(alert_data)
        print(f"🚨 THEFT ALERT SENT to Firebase at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        last_theft_alert = current_time
        
        # Reset the value to 0 after 5 seconds
        def reset_alert():
            try:
                db.child("BESCOM").child("Theft").child("value").set(0)
                print("✓ Alert value reset to 0")
            except Exception as e:
                print(f"Error resetting alert: {e}")
        
        threading.Timer(5.0, reset_alert).start()
        
    except Exception as e:
        print(f"✗ Failed to send theft alert: {e}")

def get_stream_uri(mycam, profile):
    """Get the stream URI from a camera profile"""
    try:
        media_service = mycam.create_media_service()
        
        # Get stream URI
        request = media_service.create_type('GetStreamUri')
        request.ProfileToken = profile.token
        request.StreamSetup = {'Stream': 'RTP-Unicast', 'Transport': {'Protocol': 'RTSP'}}
        
        response = media_service.GetStreamUri(request)
        return response.Uri
    except Exception as e:
        print(f"Error getting stream URI: {e}")
        return None

def detect_persons(frame):
    """Detect persons in the frame using YOLOv8"""
    try:
        # Run inference - detect only person class (class 0) with confidence > 0.5
        results = model.predict(
            frame, 
            classes=[0],  # Only detect person class
            conf=0.6,     # Confidence threshold
            verbose=False,
            imgsz=320     # Smaller input size for faster inference
        )
        
        person_count = 0
        
        # Process results
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 2)
                    
                    # Add label with confidence
                    label = f'PERSON DETECTED: {confidence:.2f}'
                    label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                    cv2.rectangle(frame, (int(x1), int(y1-label_size[1]-10)), 
                                (int(x1+label_size[0]), int(y1)), (0, 0, 255), -1)
                    cv2.putText(frame, label, (int(x1), int(y1-5)), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                    
                    person_count += 1
        
        # Send theft alert if person detected
        if person_count > 0:
            # Run in separate thread to avoid blocking video stream
            threading.Thread(target=send_theft_alert, daemon=True).start()
            
            # Add warning text to frame
            cv2.putText(frame, '🚨 THEFT ALERT SENT!', (10, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        # Display person count
        cv2.putText(frame, f'Persons: {person_count}', (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        return frame, person_count
        
    except Exception as e:
        print(f"Error in person detection: {e}")
        return frame, 0

def main():
    print("=== CP Plus Camera + YOLO Person Detection + Firebase Theft Alert ===")
    
    # Test Firebase connection
    try:
        test_data = {"test": "connection", "timestamp": datetime.now().isoformat()}
        db.child("test_connection").set(test_data)
        print("✓ Firebase connection test successful")
    except Exception as e:
        print(f"✗ Firebase connection test failed: {e}")
    
    # Try to connect directly to the known camera on port 8000
    try:
        print(f"Connecting to ONVIF camera at {CAMERA_IP}:{PORT}...")
        
        # Connect to camera
        mycam = ONVIFCamera(CAMERA_IP, PORT, USERNAME, PASSWORD)
        
        # Get device information
        try:
            device_info = mycam.devicemgmt.GetDeviceInformation()
            print(f"✓ Successfully connected to camera via ONVIF!")
            print(f"Device Information:")
            print(f"  Manufacturer: {device_info.Manufacturer}")
            print(f"  Model: {device_info.Model}")
        except Exception as e:
            print(f"Could not get device info: {e}")
        
        # Get camera profiles
        media_service = mycam.create_media_service()
        profiles = media_service.GetProfiles()
        
        print(f"\nFound {len(profiles)} stream profiles:")
        
        streaming_urls = []
        
        # Try each profile to get a stream URL
        for i, profile in enumerate(profiles):
            print(f"\nProfile {i+1}: {profile.Name}")
            
            # Get stream URI
            stream_uri = get_stream_uri(mycam, profile)
            if stream_uri:
                print(f"✓ RTSP Stream URI: {stream_uri}")
                streaming_urls.append(stream_uri)
            else:
                print("✗ Could not get RTSP Stream URI")
        
        if not streaming_urls:
            print("✗ No streaming URLs found via ONVIF.")
            
            # Try some common URL patterns for CP Plus cameras
            encoded_password = urllib.parse.quote(PASSWORD)
            common_urls = [
                f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/cam/realmonitor?channel=1&subtype=0",
                f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/h264/ch01/main/av_stream",
                f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/Streaming/Channels/101",
                f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/live/ch00_0",
                f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/live",
                f"rtsp://{USERNAME}:{encoded_password}@{CAMERA_IP}:{PORT}/stream"
            ]
            
            print("\nTrying common CP Plus URL patterns:")
            for url in common_urls:
                print(f"Testing: {url}")
                streaming_urls.append(url)
            
        # Try to stream the video with person detection
        success = False
        for url in streaming_urls:
            print(f"\nAttempting to stream video from URL: {url}")
            
            # Set RTSP transport to TCP using environment variable
            os.environ["OPENCV_FFMPEG_TRANSPORT_OPTION"] = "rtsp_transport=tcp"
            
            # Use OpenCV to display the stream
            cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
            
            # Set reduced buffer size for real-time streaming
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            if not cap.isOpened():
                print("✗ Failed to open video stream with this URL")
                continue
            
            # Try to read a frame to verify
            ret, frame = cap.read()
            if not ret:
                print("✗ Could not read frames from this URL")
                cap.release()
                continue
            
            print("✓ Successfully opened video stream!")
            print(f"Working URL: {url}")
            print("Displaying video with person detection and Firebase alerts.")
            print("Controls: 'q' to exit, 's' to save screenshot")
            success = True
            
            frame_count = 0
            fps_counter = 0
            fps_timer = time.time()
            
            try:
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        print("✗ Failed to get frame")
                        break
                    
                    # Reduce frame size for better performance (50% of original)
                    height, width = frame.shape[:2]
                    new_width = int(width * 0.5)  # 50% reduction
                    new_height = int(height * 0.5)
                    frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_AREA)
                    
                    # Apply person detection every 5th frame for performance
                    if frame_count % 5 == 0:
                        frame, person_count = detect_persons(frame)
                    
                    # Calculate and display FPS
                    fps_counter += 1
                    current_time = time.time()
                    if current_time - fps_timer >= 1.0:
                        fps = fps_counter
                        fps_counter = 0
                        fps_timer = current_time
                    else:
                        fps = fps_counter
                    
                    # Display info on frame
                    cv2.putText(frame, f'FPS: {fps}', (10, new_height - 60), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                    cv2.putText(frame, f'Resolution: {new_width}x{new_height}', (10, new_height - 40), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    cv2.putText(frame, f'Firebase: Connected', (10, new_height - 20), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                    
                    cv2.imshow('CP Plus - Theft Detection System', frame)
                    
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        break
                    elif key == ord('s'):
                        # Save screenshot
                        screenshot_name = f"theft_detection_{int(time.time())}.jpg"
                        cv2.imwrite(screenshot_name, frame)
                        print(f"Screenshot saved: {screenshot_name}")
                    
                    frame_count += 1
                    
            except Exception as e:
                print(f"Error during streaming: {e}")
            finally:
                cap.release()
                cv2.destroyAllWindows()
                
            if success:
                break
        
        if not success:
            print("\n✗ Could not stream from any URL.")
            print("\nAlternative options:")
            print("1. Use the RTSP URL in VLC media player to test")
            print("2. Access the camera's web interface")
            print("3. Install CP Plus EzyKam or IVMS software")
        
    except Exception as e:
        print(f"Error connecting to camera: {e}")
        print("\nRecommendations:")
        print(f"1. Try accessing the web interface at http://{CAMERA_IP}:{PORT}")
        print("2. Use the CP Plus EzyKam mobile app")
        print("3. Check your camera documentation for the exact RTSP URL format")

if __name__ == "__main__":
    main()
