## 线程

线程允许控制程序并行（**同一时刻**执行不同的任务）地执行代码，C++标准库`thread`中支持进行线程的相关操作：

```c++
#include <iostream>
#include <thread>

static bool s_Finished = false;

void DoWork() {
    using namespace std::literals::chrono_literals;
    
    std::cout << "Thread id = " << std::this_thread::get_id() << std::endl; // Thread id = 2
    while (!s_Finished) {
        std::cout << "Working...\n";
        std::this_thread::sleep_for(1s); // 延迟 1s
    }
}

int main() {
    std::thread worker(DoWork); // 定义线程
    
    std::cin.get();
    s_Finished = true;
    
    worker.join(); // 等待线程
    std::cout << "Finished!" << std::endl;
    std::cout << "Thread id = " << std::this_thread::get_id() << std::endl; // Thread id = 1
    std::cin.get();
}
```

* `std::thread`类支持启动一个线程执行任务，参数是一个函数指针（详见[[C++自学 21] | C++原始函数指针与lambda函数](https://past-blog.vercel.app/blog/pointer-lambda-function)）
* `.join()`方法实际上是等待指定线程执行任务直到其结束，并阻塞当前线程（类似于同步机制）
* `std::this_thread::get_id()`顾名思义，获取当前作用域的线程的`id`
* 上述代码可以在等待用户输入的同时让另一个线程并行地不断输出`Working...`字样

## 计时

处于基准测试或程序优化的需要，除了各平台特定的操作系统提供的计时方法之外，C++本身提供一套与平台无关的计时方法，主要用到了`chrono`标准库：

```c++
#include <iostream>
#include <chrono>
#include <thread>

int main() {
    using namespace std::literals::chrono_literals;
    auto start = std::chrono::high_resolution_clock::now();
    std::this_thread::sleep_for(1s);
    auto end = std::chrono::high_resolution_clock::now();
    
    std::chrono::duration<float> duration = end - start;
    std::cout << duration.count() << "s" << std::endl; // 1.00465s（每次运行不同）
}
```

除了基础的计时用法之外，还可以利用类对象的生存期机制实现自动地计时器构造，如下：

```c++
#include <iostream>
#include <chrono>
#include <thread>

struct Timer {
    std::chrono::time_point<std::chrono::system_clock> start, end;
    std::chrono::duration<float> duration;
    Timer() {
        start = std::chrono::high_resolution_clock::now();
    }
    ~Timer() {
        end = std::chrono::high_resolution_clock::now();
        duration = end - start;
        float ms = duration.count() * 1000.0f;
        std::cout << "Timer took " << ms << "ms" << std::endl;
    }
};

void function() {
    Timer timer;
    for(int i = 0; i < 100; i++)
        std::cout << "writing..." << std::endl; // Timer took 12.0039ms
        // std::cout << "writing...\n"; // Timer took 8.1158ms
}

int main() {
    function();
    std::cin.get();
}
```

* 通过在`Timer`类的构造和析构函数中分别创建计时器并计算耗时，可以很轻松地在诸如`function`这样的函数中进行**自动计时**，仅需在函数开始创建一个`Timer`实例即可
* 值得注意的是，**利用`std::endl`换行比利用`\n`换行100次要慢约一半时间**