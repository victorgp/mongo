// processinfo.cpp

/*    Copyright 2009 10gen Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

#include "mongo/pch.h"

#include "mongo/base/init.h"
#include "mongo/util/processinfo.h"

#include <iostream>
#include <fstream>

using namespace std;

namespace mongo {

    class PidFileWiper {
    public:
        ~PidFileWiper() {
            if (path.empty()) {
                return;
            }

            ofstream out( path.c_str() , ios_base::out );
            out.close();
        }

        bool write( const string& p ) {
            path = p;
            ofstream out( path.c_str() , ios_base::out );
            out << ProcessId::getCurrent() << endl;
            return out.good();
        }

        string path;
    } pidFileWiper;

    bool writePidFile( const string& path ) {
        bool e = pidFileWiper.write( path );
        if (!e) {
            log() << "ERROR: Cannot write pid file to " << path
                  << ": "<< strerror(errno);
        }
        return e;
    }

    ProcessInfo::SystemInfo* ProcessInfo::systemInfo = NULL;

    void ProcessInfo::initializeSystemInfo() {
        if (systemInfo == NULL) {
            systemInfo = new SystemInfo();
        }
    }

    MONGO_INITIALIZER(SystemInfo)(InitializerContext* context) {
        ProcessInfo::initializeSystemInfo();
        return Status::OK();
    }

}