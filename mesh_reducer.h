typedef struct _vert_t{
    float pos[3];
} vert_t;

typedef struct _face_t{
    vert_t * a;
    vert_t * b;
    vert_t * c;
} face_t;