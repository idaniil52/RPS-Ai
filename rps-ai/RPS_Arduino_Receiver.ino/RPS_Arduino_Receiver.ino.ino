String input;

void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);  // L LED
}

void loop() {
  if (Serial.available()) {
    input = Serial.readStringUntil('\n');

    if (input == "win") {
      // Blink L LED 2 times
      for (int i = 0; i < 2; i++) {
        digitalWrite(13, HIGH);
        delay(200);
        digitalWrite(13, LOW);
        delay(200);
      }
    } 
    
    else if (input == "lose") {
      // Blink L LED 3 times
      for (int i = 0; i < 3; i++) {
        digitalWrite(13, HIGH);
        delay(200);
        digitalWrite(13, LOW);
        delay(200);
      }
    } 
    
    else if (input == "tie") {
      // Blink L LED 4 times
      for (int i = 0; i < 4; i++) {
        digitalWrite(13, HIGH);
        delay(200);
        digitalWrite(13, LOW);
        delay(200);
      }
    }
  }
}
