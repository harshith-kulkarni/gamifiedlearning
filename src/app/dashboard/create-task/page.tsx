'use client';

export default function CreateTaskPage() {
    return (
        <div className="container mx-auto max-w-3xl py-8">
            <div className="shadow-lg border rounded-lg">
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-2">Create a New Study Session</h1>
                    <p className="text-gray-600 mb-6">Upload a PDF document to begin your interactive learning experience.</p>
                    
                    <div className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg">
                        <div className="text-center text-gray-500">
                            <div className="mx-auto h-12 w-12 mb-2">📄</div>
                            <p className="font-semibold">Drag & drop your PDF here</p>
                            <p className="text-sm">or click to browse</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium mb-2">Study Duration (minutes)</label>
                        <input 
                            type="number"
                            defaultValue={25}
                            min="1"
                            className="border rounded px-3 py-2 max-w-xs"
                        />
                    </div>

                    <button 
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                        disabled
                    >
                        Create Study Session (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
}