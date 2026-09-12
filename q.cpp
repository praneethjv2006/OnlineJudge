#include <bits/stdc++.h>
using namespace std;

enum class VehicleType {CAR,BIKE,TRUCK};
enum class SpotType {CAR,BIKE,TRUCK};

class Vehicle {
public:
    string license; VehicleType type;
    Vehicle(string license, VehicleType type):license(license), type(type) {}
};
// ---------------- ParkingSpot ----------------
class ParkingSpot {
public:
    int id; SpotType type; Vehicle* vehicle;
    ParkingSpot(int id, SpotType type)
        : id(id), type(type), vehicle(nullptr) {}

    bool isFree() {return vehicle == nullptr;}
    bool canFit(Vehicle* v) {
        return isFree() &&
               (type == SpotType::CAR && v->type == VehicleType::CAR ||
                type == SpotType::BIKE && v->type == VehicleType::BIKE ||
                type == SpotType::TRUCK && v->type == VehicleType::TRUCK);
    }
    void assignVehicle(Vehicle* v) { vehicle = v; }
    void removeVehicle() { vehicle = nullptr;}
};
// ---------------- Level ----------------
class Level {
public:
    int floor; vector<ParkingSpot*> spots;
    Level(int floor) : floor(floor) {}
    void addSpot(ParkingSpot* spot) {spots.push_back(spot); }
    ParkingSpot* getSpot(Vehicle* v) {
        for (auto spot : spots)if(spot->canFit(v)) return spot;
        return nullptr;
    }
    bool parkVehicle(Vehicle* v) {
        ParkingSpot* spot = getSpot(v);
        if (spot == nullptr) return false;
        spot->assignVehicle(v);
        return true;
    }
};

// ---------------- Ticket ----------------
class Ticket {
public:
    int id; Vehicle* vehicle; ParkingSpot* spot; long long entryTime;
    Ticket(int id, Vehicle* vehicle, ParkingSpot* spot)
        : id(id), vehicle(vehicle), spot(spot) { entryTime = time(nullptr);}
};
// ---------------- ParkingLot ----------------
class ParkingLot {
public:
    vector<Level*> levels; int nextTicketId = 1;
    void addLevel(Level* level) { levels.push_back(level);}
    Ticket* parkVehicle(Vehicle* v) {
        for (auto level : levels) {
            ParkingSpot* spot = level->getSpot(v);
            if (spot != nullptr) {
                spot->assignVehicle(v);
                Ticket* ticket = new Ticket(nextTicketId++, v, spot);
                return ticket;
            }
        }
        cout << "No parking spot available\n";
        return nullptr;
    }

    void freeSpot(Ticket* ticket) {
        if (ticket == nullptr)return;
        ticket->spot->removeVehicle();
    }
};

// ---------------- Main ----------------
int main() {
    ParkingLot lot;
    Level* level1 = new Level(1);
    level1->addSpot(new ParkingSpot(1, SpotType::CAR));
    level1->addSpot(new ParkingSpot(2, SpotType::BIKE));
    level1->addSpot(new ParkingSpot(3, SpotType::TRUCK));
    lot.addLevel(level1);
    Vehicle car("KA01AB1234", VehicleType::CAR);
    Vehicle bike("KA02XY5678", VehicleType::BIKE);
    Ticket* carTicket = lot.parkVehicle(&car);
    Ticket* bikeTicket = lot.parkVehicle(&bike);
    lot.freeSpot(carTicket);
    return 0;
}