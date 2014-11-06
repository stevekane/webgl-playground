#include <stdio.h>

const int MAX_PARTICLE_COUNT = 10;

struct Vec3 {
  float x;
  float y;
  float z;
};

struct Particle {
  float deathTime;
};

struct ParticlePool {
  int liveCount;
  struct Particle particles[MAX_PARTICLE_COUNT];
};

void initializePool (struct ParticlePool *pool) {
  int poolCount = sizeof(pool->particles) / sizeof(struct Particle);

  pool->liveCount = 0;
  for (int i = 0; i < poolCount; ++i) {
    pool->particles[i].deathTime = 0;
  }
}

void printPool (struct ParticlePool *pool) {
  int poolCount = sizeof(pool->particles) / sizeof(struct Particle);

  for (int i = 0; i < poolCount; ++i) {
    printf("%10.2f\t", pool->particles[i].deathTime);
  }
  printf("\n");
}

//so-called "external" initialization
struct Particle *newParticle (struct ParticlePool *pool) {
  return &pool->particles[pool->liveCount++];
}

//so-called "contained" initialization
void enliven (struct ParticlePool *pool, float deathTime) {
  pool->particles[pool->liveCount++].deathTime = deathTime;
}

void kill (struct ParticlePool *pool, int index) {
  int count = pool->liveCount - 1; 

  if (index > count || index < 0) return;
  pool->particles[index].deathTime = pool->particles[count].deathTime;
  pool->particles[count].deathTime = 0.0;
  pool->liveCount--;
}

void update (struct ParticlePool *pool, float dT) {
  int j        = 0;
  int i        = 0;
  int maxIndex = pool->liveCount;

  while (i < maxIndex) {
    pool->particles[i].deathTime -= dT;
    i++; 
  }

  while (j < pool->liveCount) {
    if (pool->particles[j].deathTime <= 0.0) kill(pool, j);
    else                                     j++;
  }
  printPool(pool);
}

int main (int argc, char *argv[]) {
  struct ParticlePool particlePool;  
  float dT = 1;

  initializePool(&particlePool);
  enliven(&particlePool, 3.0);
  enliven(&particlePool, 2.0);
  enliven(&particlePool, 4.0);
  newParticle(&particlePool)->deathTime = 9.0;
  newParticle(&particlePool)->deathTime = 7.0;
  newParticle(&particlePool)->deathTime = 2.0;
  update(&particlePool, dT);
  update(&particlePool, dT);
  enliven(&particlePool, 10.0);
  update(&particlePool, dT);
  update(&particlePool, dT);
  enliven(&particlePool, 12.0);
  update(&particlePool, dT);
  update(&particlePool, dT);
  update(&particlePool, dT);
  update(&particlePool, dT);
  update(&particlePool, dT);
  update(&particlePool, dT);
  update(&particlePool, dT);
  update(&particlePool, dT);
  update(&particlePool, dT);

  return 0;
}
