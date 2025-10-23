def MSGHandler(Spacket: List[str]):
   if Spacket[1] == "MSG":
       packetHelper(parse_float(Spacket[0]),
           1,
           parse_float(Spacket[2]),
           Spacket[3],
           len(Spacket[3]))
   elif Spacket[1] == "JN":
       ClientHelper(parse_float(Spacket[0]), 0)
   else:
       packetHelper(999, 0, parse_float(Spacket[0]), "failed", 6)
def deleteClient(ID: number):
   global index4
   serial.write_line("Client:" + ("" + str(ID)) + ",Update:Removed," + ("TimeStamp:" + ("" + str(control.millis()))))
   if len(convert_to_text(ID)) <= 2 and len(convert_to_text(ID)) > 0:
       index4 = clientvirtualmap.index_of(ID)
       clientvirtualmap[index4] = 0
       Clients[index4] = 0
       Lease[index4] = 0
       return 1
   elif len(convert_to_text(ID)) == 3:
       index4 = Clients.index_of(ID)
       Clients[index4] = 0
       clientvirtualmap[index4] = 0
       Lease[index4] = 0
       return 1
   else:
       return 0
def commandHandler(Packet: List[any], Buffer2: number, serialN: number):
   global CMD1, unCMD1
   serial.write_line("Packet received: " + ":" + str(Packet[1]))
   for value in HDevID:
       if convert_to_text(FBV1(convert_to_text(serialN))) == convert_to_text(value):
           if Packet[1] == "CMD":
               CMD1 = convert_to_text(Packet[3])
               unCMD1 = CMD1.split(",")
               serial.write_line("CHecking Command:" + unCMD1[0] + ":" + str(Packet[3]))
               if unCMD1[0] == "reboot":
                   control.reset()
                   return 1
               if unCMD1[0] == "Channel":
                   radio.set_group(parse_float(unCMD1[1]))
                   serial.write_line("Config:channel,update:" + unCMD1[1] + ",status:Success")
                   return 1
               if unCMD1[0] == "NI":
                   return 1
           else:
               serial.write_line("Was not a CMD command" + "")
               MSGHandler(Packet)
               return 0
   MSGHandler(Packet)
   serial.write_string("Could not authenticate " + ("" + str(serialN)) + " passing to Message Handler")
   return 0
def FBV1(data: str):
   global hash2, j
   hash2 = 2166136261
   j = 0
   while j <= len(data) - 1:
       b_val = data.char_code_at(j)
       hash2 = hash2 * 16777619 & 0xffffffff
       j += 1
   return hash2
def packetHandler(serialN2: number, Signal_strength: number, Data: str, buffer: number):
   global Packet2
   Packet2 = []
   if len(Data) == buffer:
       if serialN2 != 0:
           Packet2 = Data.split(":")
           if len(Packet2) == 4:
               ClientHelper(5, parse_float(Packet2[0]))
               commandHandler(Packet2, len(Packet2), serialN2)
           else:
               serial.write_string("Malformed packet:" + ("" + str(Packet2)))
       else:
           serial.write_string("untrusted packet")
           Packet2 = Data.split(":")
           if len(Packet2) == 4:
               MSGHandler(Packet2)
           else:
               serial.write_string("Malformed packet:" + ("" + str(Packet2)))
   else:
       serial.write_string("Packet Dropped: " + "Data Size:" + str(len(Data)) + "Buffer size: " + ("" + str(buffer)))
   return 0
def packetHelper(From: number, Mode: number, To: number, data2: str, buffer2: number):
   if len(data2) == buffer2:
       if Mode == 0:
           radio.send_string("" + str(From) + ":" + "SMSG" + ":" + ("" + str(To)) + ":" + data2)
           return 1
       elif Mode == 1:
           radio.send_string("" + str(ClientHelper(From, 2)) + ":" + "MSG" + ":" + ("" + str(ClientHelper(To, 1))) + ":" + data2)
           return 1
       elif Mode == 2:
           radio.send_string("999" + ":" + "BRD" + ":" + "0" + ":" + data2)
           return 1
       else:
           return 0
   return 0
def boot():
   global bState
   bState = 0
   config()
   Diagnostic()
   serial.write_numbers(Clients)
   serial.write_numbers(clientvirtualmap)
   serial.write_numbers(Lease)
   serial.write_numbers(HDevID)
   radio.set_group(0)
   serial.write_line("AIOS-DSPS-1")
   serial.write_line(control.device_name())
   serial.write_line("Serial Number:" + ("" + str(control.device_serial_number())))
   serial.write_line("" + str(FBV1(convert_to_text(control.device_serial_number()))))
   serial.write_line("Boot Time:" + ("" + str(control.millis())))
   serial.write_line("Hash:" + ("" + str(hSerial)))
   basic.pause(2000)
   if input.button_is_pressed(Button.AB):
       pass
   else:
       print(":)")
def config():
   global DevID, HDevID, result, MClients, proName, hSerial, LeaseT, leaseMs
   for index5 in range(MClients):
       Clients.append(0)
       clientvirtualmap.append(0)
       Lease.append(0)
   DevID = [control.device_serial_number(),
       1234512345,
       1234512345,
       1234512345,
       1234512345]
   HDevID = []
   for value2 in DevID:
       result = FBV1(convert_to_text(value2))
       HDevID.append(result)
   result = 0
   MClients = 15
   proName = "A.I-Mobile"
   hSerial = FBV1(convert_to_text(control.device_serial_number()))
   LeaseT = 3
   leaseMs = LeaseT * 60000
   serial.write_line(proName)
   serial.write_line("SN: " + ("" + str(hSerial)))
   serial.write_line("Max Clients: " + ("" + str(MClients)))
   serial.write_line("Lease time: " + ("" + str(LeaseT)) + "M")
   serial.write_line("")


def on_received_string(receivedString):
   packetHandler(radio.received_packet(RadioPacketProperty.SERIAL_NUMBER),
       radio.received_packet(RadioPacketProperty.SIGNAL_STRENGTH),
       receivedString,
       len(receivedString))
radio.on_received_string(on_received_string)


def ClientHelper(SRC: number, mode: number):
   global index2
   if mode == 0:
       serial.write_line("" + str(Clients.index_of(SRC)))
       if Clients.index_of(SRC) == -1:
           index3 = 0
           index2 = 0
           index = 0
           serial.write_line("max Clients:" + ("" + str(MClients)))
           while index3 < MClients:
               if Clients[index3] == 0:
                   Clients[index3] = SRC
                   clientvirtualmap[index3] = index3 + 1
                   Lease[index3] = input.running_time()
                   return 1
               index3 += 1
           serial.write_line("ERROR")
           return 0
       return 1
   elif mode == 1:
       if clientvirtualmap.index_of(SRC) != -1:
           index2 = clientvirtualmap.index_of(SRC)
           return Clients[index2]
       return 0
   elif mode == 2:
       if Clients.index_of(SRC) != -1:
           index2 = Clients.index_of(SRC)
           return clientvirtualmap[index2]
   elif mode == 3:
       pass
   elif mode == 4:
       if Clients.index_of(SRC) != -1:
           Lease[Clients.index_of(SRC)] = input.running_time()
       else:
           return 0
   else:
       pass
   return 0
def leaseCheck():
   global currentTime, Tindex
   currentTime = input.running_time()
   Tindex = 0
   while Tindex < MClients:
       if Clients[Tindex] != 0:
           if abs(Lease[Tindex] - currentTime) >= leaseMs:
               serial.write_line("Client Lease Expired")
               deleteClient(Clients[Tindex])
       Tindex += 1
def Diagnostic():
   global fakepacket
   if ClientHelper(421, 0):
       serial.write_line("Array Check: PASS")
       if ClientHelper(421, 2) != 0:
           serial.write_line("Real to VMAP: PASS")
           if ClientHelper(1, 1) != 0:
               serial.write_line("VMAP to Real: PASS")
           else:
               serial.write_line("VMAP to Real: FAIL")
               return 0
       else:
           serial.write_line("Real to VMAP: FAIL")
           serial.write_line("VMAP to Real: N/A")
           return 0
   else:
       serial.write_line("Array Check: FAIL")
       serial.write_line("Real to VMAP: N/A")
       serial.write_line("VMAP to Real: N/A")
       return 0
   fakepacket = ["192", "CMD", "999", "Channel,1"]
   serial.write_string("" + (fakepacket[0]))
   serial.write_line("Beginning Command handler check")
   if commandHandler(fakepacket, len(fakepacket), HDevID[0]) == 1:
       pass
   else:
       control.wait_micros(4000000)
   serial.write_line("clearing Client")
   deleteClient(421)
   return 1
fakepacket: List[str] = []
Tindex = 0
currentTime = 0
index2 = 0
leaseMs = 0
LeaseT = 0
proName = ""
result = 0
DevID: List[number] = []
hSerial = 0
bState = 0
j = 0
unCMD1: List[str] = []
CMD1 = ""
HDevID: List[number] = []
index4 = 0
Lease: List[number] = []
clientvirtualmap: List[number] = []
MClients = 0
Clients: List[number] = []
hash2 = 0
k = 0
Packet2: List[str] = []
Clients = [0]
MClients = 15
Clients = []
clientvirtualmap = []
Lease = []
boot()
radio.set_transmit_serial_number(True)


def on_forever():
   leaseCheck()
   basic.pause(30000)
basic.forever(on_forever)
