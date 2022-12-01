# How to debug, export LOG_LEVEL=DEBUG into the shell before running `python3 -m server` inside the container

# For element properties, the parameter name must be the name of the element's property, if it doesn't exist, it won't show up/added into the element

"properties": {
	"detection": {
		"type": "object",
		"element": {
			"name": "detection",
			"format": "element-properties"
		},
		"reshape": {
			"type": "string",
			"default": "true"
		},
		"reshape-height": {
			"type": "integer",
			"minimum": 400,
			"maximum": 600,
			"default": 500
		},
		"reshape-width": {
			"type": "integer",
			"minimum": 400,
			"maximum": 600,
			"default": 500
		}
	}
}

curl -X POST -H 'Content-Type: application/json' -H 'User-Agent: python-requests/2.25.1' -d '{"source": {"uri": "file:///home/pipeline-server/sample-media/4k_15fps_10bottles_h264_5mins.mp4", "type": "uri"}, "parameters": {"tracking": {"tracking-type": "zero-term-imageless"}, "barcode-properties": {"reclassify_interval": 5}, "classification": {"reclassify-interval": 5}, "tracked_object_filter": {"reclassify_interval": 5}, "detection": {"reshape": true, "reshape-height": 511, "reshape-width": 522}, "text-detection": {}, "text-recognition": {}, "detection-device": "CPU", "detection-model-instance-id": "detect_object_detection_person_vehicle_bike_CPU"}, "destination": {"metadata": {"type": "file", "path": "/tmp/results.jsonl", "format": "json-lines"}}}' http://localhost:8080/pipelines/cascade/tracking

# More flexible, your name of your parameter can be anything as long as the request parameter name matches the pipeline.json's variable name

"properties": {
	"reshape": {
		"type": "string",
		"default": "true"
	},
	"reshape-height": {
		"type": "integer",
		"minimum": 400,
		"maximum": 600,
		"default": 500
	},
	"reshape-width": {
		"type": "integer",
		"minimum": 400,
		"maximum": 600,
		"default": 500
	},
	"detection": {
		"type": "object",
		"element": {
			"name": "detection",
			"format": "element-properties"
		}
	}
}

curl -X POST -H 'Content-Type: application/json' -H 'User-Agent: python-requests/2.25.1' -d '{"source": {"uri": "file:///home/pipeline-server/sample-media/4k_15fps_10bottles_h264_5mins.mp4", "type": "uri"}, "parameters": {"reshape": "true", "reshape-height": 511, "reshape-width": 522, "tracking": {"tracking-type": "zero-term-imageless"}, "barcode-properties": {"reclassify_interval": 5}, "classification": {"reclassify-interval": 5}, "tracked_object_filter": {"reclassify_interval": 5}, "detection": {}, "text-detection": {}, "text-recognition": {}, "detection-device": "CPU", "detection-model-instance-id": "detect_object_detection_person_vehicle_bike_CPU"}, "destination": {"metadata": {"type": "file", "path": "/tmp/results.jsonl", "format": "json-lines"}}}' http://localhost:8080/pipelines/cascade/tracking


no_proxy=localhost curl http://localhost:8080/pipelines/object_detection/person_vehicle_bike -X POST -H \
'Content-Type: application/json' -d \
'{
    "source": {
        "uri": "https://github.com/intel-iot-devkit/sample-videos/blob/master/person-bicycle-car-detection.mp4?raw=true",
        "type": "uri"
    }
}'

