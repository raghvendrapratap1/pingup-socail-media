import Queue from "bull";
import Story from "../models/Story.js";

// Create queue with error handling
let storyQueue;

// Prefer in-memory queue when no Redis configuration is provided
const useInMemoryQueue = (!process.env.REDIS_HOST && !process.env.REDIS_URL);

if (useInMemoryQueue) {
    // Simple in-memory queue implementation
    const inMemoryQueue = new Map();
    const eventListeners = new Map();
    
    storyQueue = {
        add: async (data, options) => {
            const jobId = Date.now().toString();
            const { storyId } = data;
            const delay = options?.delay || 24 * 60 * 60 * 1000; // Default 24 hours
            
            // Schedule deletion using setTimeout
            setTimeout(async () => {
                try {
                    const deletedStory = await Story.findByIdAndDelete(storyId);
                    if (deletedStory) {
                        // Trigger completed event if listeners exist
                        if (eventListeners.has('completed')) {
                            eventListeners.get('completed').forEach(callback => {
                                callback({ id: jobId, data });
                            });
                        }
                    }
                } catch (err) {
                    // Trigger failed event if listeners exist
                    if (eventListeners.has('failed')) {
                        eventListeners.get('failed').forEach(callback => {
                            callback({ id: jobId, data }, err);
                        });
                    }
                }
            }, delay);
            
            inMemoryQueue.set(jobId, { data, options });
            return { id: jobId };
        },
        on: (event, callback) => {
            // Store event listeners for in-memory queue
            if (!eventListeners.has(event)) {
                eventListeners.set(event, []);
            }
            eventListeners.get(event).push(callback);
        },
        process: () => {}, // Mock processor
        close: async () => {
            return Promise.resolve();
        },
        getJobs: async () => [] // Mock getJobs method
    };
    
} else {
    try {
        // Use environment variables or defaults
        const redisHost = process.env.REDIS_HOST || "127.0.0.1";
        const redisPort = process.env.REDIS_PORT || 6379;
        
        storyQueue = new Queue("storyQueue", {
            redis: { 
                host: redisHost, 
                port: redisPort,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                connectTimeout: 5000, // 5 second timeout
                lazyConnect: true // Don't connect immediately
            }
        });

        // Add queue event listeners
        storyQueue.on('waiting', (jobId) => {
            // Job is waiting to be processed
        });

        storyQueue.on('active', (job) => {
            // Job is now active
        });

        storyQueue.on('completed', (job) => {
            // Job completed successfully
        });

        storyQueue.on('failed', (job, err) => {
            // Job failed
        });

        storyQueue.on('error', (error) => {
            // Bull queue error
        });

    } catch (error) {
        // Create a mock queue that does nothing
        storyQueue = {
            add: async () => {
                return { id: 'mock' };
            },
            on: () => {}, // Mock event listener
            process: () => {}, // Mock processor
            close: async () => Promise.resolve(), // Mock close method
            getJobs: async () => [] // Mock getJobs method
        };
    }
}

// Process deletion jobs (only for Redis queue)
if (!useInMemoryQueue && storyQueue.process) {
    storyQueue.process(async (job) => {
        const { storyId } = job.data;
        try {
            const deletedStory = await Story.findByIdAndDelete(storyId);
        } catch (err) {
            // Error deleting story
        }
    });
}

export default storyQueue;