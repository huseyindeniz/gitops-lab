# NVIDIA TRITON INFERENCE SERVER

## Add your local MinIO server

mc alias set localminio http://api.minio.staging.local minio minio123

## Make sure your model bucket exists

mc mb localminio/triton-model-repo

## Upload the model dir

mc cp --recursive ./simple/ localminio/triton-model-repo/

# Triton test

```bash
curl -v -X POST http://triton.staging.local/v2/models/simple/infer \
     -H "Content-Type: application/json" \
     -d '{
           "inputs": [
             {
               "name":     "INPUT0",
               "shape":    [1, 16],
               "datatype": "INT32",
               "data":     [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
             },
             {
               "name":     "INPUT1",
               "shape":    [1, 16],
               "datatype": "INT32",
               "data":     [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
             }
           ]
         }'
```

it should return

{"model_name":"simple","model_version":"1","outputs":[{"name":"OUTPUT0","datatype":"INT32","shape":[1,16],"data":[0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30]},{"name":"OUTPUT1","datatype":"INT32","shape":[1,16],"data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}]}
