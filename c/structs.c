#include <time.h>
#include <string.h>
#include <stdio.h>

struct Vec3 {
  float x;
  float y;
  float z;
};

struct Physics {
  struct Vec3 position;
  struct Vec3 velocity; 
  struct Vec3 acceleration;
};

void setVec3 (struct Vec3 *vec3, float x, float y, float z) {
  vec3->x = x;
  vec3->y = y;
  vec3->z = z;
}

void initializePhysics (struct Physics *physics, int count) {
  for (int i = 0; i < count; ++i) {
    setVec3(&physics[i].position, 10.0, 5.0, 15.0);
    setVec3(&physics[i].velocity, 1.1, 1.15, 0.25);
    setVec3(&physics[i].acceleration, 0.001, 0.0012, 0.123);
  }
}

void runPhysics (struct Physics *physics, int count, float dT) {
  float dTSquared = dT * dT;

  for (int i = 0; i < count; ++i) {
    physics[i].velocity.x += (physics[i].acceleration.x * dTSquared);
    physics[i].velocity.y += (physics[i].acceleration.y * dTSquared);
    physics[i].velocity.z += (physics[i].acceleration.z * dTSquared);
    physics[i].position.x += (physics[i].velocity.x * dT);
    physics[i].position.y += (physics[i].velocity.y * dT);
    physics[i].position.z += (physics[i].velocity.z * dT);
  } 
}

void printPhysics (struct Physics *physics, int count) {
  for (int i = 0; i < count; ++i) {
    printf("Position is: %f, %f, %f\n", 
        physics[i].position.x, 
        physics[i].position.y, 
        physics[i].position.z);
  }
}

void printMem (struct Physics *physics, int count) {
  for (int i = 0; i < count; ++i) {
    printf("%p\n", &physics[i]);
  }
}

int main (int argc, char *argv[]) {
  struct Physics physics[3];
  float dT        = 0.05;
  int sizePhysics = sizeof(struct Physics);
  int count       = sizeof(physics) / sizePhysics;
  struct Physics temp;

  initializePhysics(physics, count);

  setVec3(&physics[0].position, 35.0, 25.0, 15.0);
  memcpy(&temp, &physics[0], sizePhysics);
  memcpy(&physics[0], &physics[1], sizePhysics);
  memcpy(&physics[1], &temp, sizePhysics);
  printf("%p\n", &physics[1]);
  runPhysics(physics, count, dT);
  printPhysics(physics, count);
  //printMem(physics, count);

  return 0;
}
