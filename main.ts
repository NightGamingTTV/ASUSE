function MSGHandler(Spacket: string[]) {
    if (Spacket[1] == "MSG") {
        packetHelper(parseFloat(Spacket[0]), 1, parseFloat(Spacket[2]), Spacket[3], Spacket[3].length)
    } else if (Spacket[1] == "JN") {
        ClientHelper(parseFloat(Spacket[0]), 0)
    } else {
        packetHelper(999, 0, parseFloat(Spacket[0]), "failed", 6)
    }
    
}

function deleteClient(ID: number) {
    serial.writeLine("Client:" + ID + ",Update:Removed,TimeStamp:" + control.millis())

    let physIndex = Clients.indexOf(ID)
    if (physIndex != -1) {
        // found physical client id
        Clients[physIndex] = 0
        clientvirtualmap[physIndex] = 0
        Lease[physIndex] = 0
        return 1
    }

    let virtualIndex = clientvirtualmap.indexOf(ID)
    if (virtualIndex != -1) {
        Clients[virtualIndex] = 0
        clientvirtualmap[virtualIndex] = 0
        Lease[virtualIndex] = 0
        return 1
    }

    
    return 0
}

function commandHandler(Packet: any[], Buffer2: number, serialN: number): number {
    
    serial.writeLine("Packet received: " + ":" + ("" + ("" + Packet[1])))
    for (let value of HDevID) {
        if (convertToText(FBV1(convertToText(serialN))) == convertToText(value)) {
            if (Packet[1] == "CMD") {
                CMD1 = convertToText(Packet[3])
                unCMD1 = _py.py_string_split(CMD1, ",")
                serial.writeLine("CHecking Command:" + unCMD1[0] + ":" + ("" + ("" + Packet[3])))
                if (unCMD1[0] == "reboot") {
                    control.reset()
                    return 1
                }
                
                if (unCMD1[0] == "Channel") {
                    radio.setGroup(parseFloat(unCMD1[1]))
                    serial.writeLine("Config:channel,update:" + unCMD1[1] + ",status:Success")
                    return 1
                }
                
                if (unCMD1[0] == "NI") {
                    return 1
                }
                
            } else {
                serial.writeLine("Was not a CMD command" + "")
                MSGHandler(Packet)
                return 0
            }
            
        }
        
    }
    MSGHandler(Packet)
    serial.writeString("Could not authenticate " + ("" + ("" + serialN)) + " passing to Message Handler")
    return 0
}

function FBV1(data: string): number {
    hash2 = sec.FNV1aHash(data)
    return hash2
}

function packetHandler(serialN2: number, Signal_strength: number, Data: string, buffer: number): number {
    
    Packet2 = []
    if (Data.length == buffer) {
        if (serialN2 != 0) {
            Packet2 = _py.py_string_split(Data, ":")
            if (Packet2.length == 4) {
                ClientHelper(5, parseFloat(Packet2[0]))
                commandHandler(Packet2, Packet2.length, serialN2)
            } else {
                serial.writeString("Malformed packet:" + ("" + ("" + Packet2)))
            }
            
        } else {
            serial.writeString("untrusted packet")
            Packet2 = _py.py_string_split(Data, ":")
            if (Packet2.length == 4) {
                MSGHandler(Packet2)
            } else {
                serial.writeString("Malformed packet:" + ("" + ("" + Packet2)))
            }
            
        }
        
    } else {
        serial.writeString("Packet Dropped: " + "Data Size:" + ("" + Data.length) + "Buffer size: " + ("" + ("" + buffer)))
    }
    
    return 0
}

function packetHelper(From: number, Mode: number, To: number, data2: string, buffer2: number): number {
    if (data2.length == buffer2) {
        if (Mode == 0) {
            radio.sendString("" + ("" + From) + ":" + "SMSG" + ":" + ("" + ("" + To)) + ":" + data2)
            return 1
        } else if (Mode == 1) {
            radio.sendString("" + ("" + ClientHelper(From, 2)) + ":" + "MSG" + ":" + ("" + ("" + ClientHelper(To, 1))) + ":" + data2)
            return 1
        } else if (Mode == 2) {
            radio.sendString("999" + ":" + "BRD" + ":" + "0" + ":" + data2)
            return 1
        } else {
            return 0
        }
        
    }
    
    return 0
}

function boot() {
    
    bState = 0
    config()
    Diagnostic()
    serial.writeNumbers(Clients)
    serial.writeNumbers(clientvirtualmap)
    serial.writeNumbers(Lease)
    serial.writeNumbers(HDevID)
    radio.setGroup(0)
    serial.writeLine("AIOS-DSPS-1")
    serial.writeLine(control.deviceName())
    serial.writeLine("Serial Number:" + ("" + ("" + control.deviceSerialNumber())))
    serial.writeLine("" + ("" + FBV1(convertToText(control.deviceSerialNumber()))))
    serial.writeLine("Boot Time:" + ("" + ("" + control.millis())))
    serial.writeLine("Hash:" + ("" + ("" + hSerial)))
    basic.pause(2000)
    if (input.buttonIsPressed(Button.AB)) {
        
    } else {
        console.log(":)")
    }
    
}

function config() {
    
    for (let index5 = 0; index5 < MClients; index5++) {
        Clients.push(0)
        clientvirtualmap.push(0)
        Lease.push(0)
    }
    DevID = [control.deviceSerialNumber(), 1234512345, 1234512345, 1234512345, 1234512345]
    HDevID = []
    for (let value2 of DevID) {
        result = FBV1(convertToText(value2))
        HDevID.push(result)
    }
    result = 0
    MClients = 15
    proName = "A.I-Mobile"
    hSerial = FBV1(convertToText(control.deviceSerialNumber()))
    LeaseT = 3
    leaseMs = LeaseT * 60000
    serial.writeLine(proName)
    serial.writeLine("SN: " + ("" + ("" + hSerial)))
    serial.writeLine("Max Clients: " + ("" + ("" + MClients)))
    serial.writeLine("Lease time: " + ("" + ("" + LeaseT)) + "M")
    serial.writeLine("")
}

radio.onReceivedString(function on_received_string(receivedString: string) {
    packetHandler(radio.receivedPacket(RadioPacketProperty.SerialNumber), radio.receivedPacket(RadioPacketProperty.SignalStrength), receivedString, receivedString.length)
})
function ClientHelper(SRC: number, mode: number): number {
    let index3: number;
    let index: number;
    
    if (mode == 0) {
        serial.writeLine("" + ("" + Clients.indexOf(SRC)))
        if (Clients.indexOf(SRC) == -1) {
            index3 = 0
            index2 = 0
            index = 0
            serial.writeLine("max Clients:" + ("" + ("" + MClients)))
            while (index3 < MClients) {
                if (Clients[index3] == 0) {
                    Clients[index3] = SRC
                    clientvirtualmap[index3] = index3 + 1
                    Lease[index3] = input.runningTime()
                    return 1
                }
                
                index3 += 1
            }
            serial.writeLine("ERROR")
            return 0
        }
        
        return 1
    } else if (mode == 1) {
        if (clientvirtualmap.indexOf(SRC) != -1) {
            index2 = clientvirtualmap.indexOf(SRC)
            return Clients[index2]
        }
        
        return 0
    } else if (mode == 2) {
        if (Clients.indexOf(SRC) != -1) {
            index2 = Clients.indexOf(SRC)
            return clientvirtualmap[index2]
        }
        
    } else if (mode == 3) {
        
    } else if (mode == 4) {
        if (Clients.indexOf(SRC) != -1) {
            Lease[Clients.indexOf(SRC)] = input.runningTime()
        } else {
            return 0
        }
        
    } else {
        
    }
    
    return 0
}

function leaseCheck() {
    
    currentTime = input.runningTime()
    Tindex = 0
    while (Tindex < MClients) {
        if (Clients[Tindex] != 0) {
            if (Math.abs(Lease[Tindex] - currentTime) >= leaseMs) {
                serial.writeLine("Client Lease Expired")
                deleteClient(Clients[Tindex])
            }
            
        }
        
        Tindex += 1
    }
}

function Diagnostic(): number {
    
    if (ClientHelper(421, 0)) {
        serial.writeLine("Array Check: PASS")
        if (ClientHelper(421, 2) != 0) {
            serial.writeLine("Real to VMAP: PASS")
            if (ClientHelper(1, 1) != 0) {
                serial.writeLine("VMAP to Real: PASS")
            } else {
                serial.writeLine("VMAP to Real: FAIL")
                return 0
            }
            
        } else {
            serial.writeLine("Real to VMAP: FAIL")
            serial.writeLine("VMAP to Real: N/A")
            return 0
        }
        
    } else {
        serial.writeLine("Array Check: FAIL")
        serial.writeLine("Real to VMAP: N/A")
        serial.writeLine("VMAP to Real: N/A")
        return 0
    }
    
    fakepacket = ["192", "CMD", "999", "Channel,1"]
    serial.writeString("" + fakepacket[0])
    serial.writeLine("Beginning Command handler check")
    if (commandHandler(fakepacket, fakepacket.length, DevID[0]) == 1) {
        console.log("command handler: PASS")
    } else {
        console.log("command handler: FAILED")
        return 0
    }
    
    serial.writeLine("clearing Client")
    deleteClient(421)
    return 1
}

let fakepacket : string[] = []
let Tindex = 0
let currentTime = 0
let index2 = 0
let leaseMs = 0
let LeaseT = 0
let proName = ""
let result = 0
let DevID : number[] = []
let hSerial = 0
let bState = 0
let j = 0
let HDevID : number[] = []
let index4 = 0
let Lease : number[] = []
let clientvirtualmap : number[] = []
let MClients = 0
let Clients : number[] = []
let Packet2 : string[] = []
let k = 0
let hash2 = 0
let CMD1 = ""
let unCMD1 : string[] = []
Clients = [0]
MClients = 15
Clients = []
clientvirtualmap = []
Lease = []
boot()
radio.setTransmitSerialNumber(true)
basic.forever(function on_forever() {
    leaseCheck()
    basic.pause(30000)
})
